import { NextRequest, NextResponse } from 'next/server';
import { getFirebaseAdmin } from '@/lib/firebaseAdmin';
import { sendAdminNotification } from '@/lib/email-notifications';
import { generateAdminNotificationEmail } from '@/lib/email-templates';
import type { PendingRequestSummary } from '@/lib/cron/pendingRequests';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    console.log('🔄 Resending admin notification emails for pending vacation requests...');

    // Get Firebase admin instance
    const { db, error } = getFirebaseAdmin();
    if (!db || error) {
      console.error('❌ Firebase Admin not available:', error);
      return NextResponse.json({
        success: false,
        error: 'Firebase Admin not available',
        details: error
      }, { status: 500 });
    }

    console.log('✅ Firebase Admin connected successfully');

    // Get all pending vacation requests
    console.log('🔍 Fetching pending vacation requests...');
    const snapshot = await db
      .collection('vacationRequests')
      .where('status', '==', 'pending')
      .orderBy('createdAt', 'desc')
      .get();

    const pendingRequests: PendingRequestSummary[] = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    console.log(`📋 Found ${pendingRequests.length} pending vacation requests`);

    if (pendingRequests.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No pending requests found',
        processedCount: 0,
        successCount: 0,
        errorCount: 0
      });
    }

    // Process each pending request
    let successCount = 0;
    let errorCount = 0;
    const errors: string[] = [];

    for (const request of pendingRequests) {
      try {
        console.log(`📧 Processing request #${request.id} - ${request.userName || request.userEmail || 'Unknown'}`);
        
        // Generate admin notification email
        const emailData = {
          id: request.id,
          userName: request.userName || 'Unknown',
          userEmail: request.userEmail || '',
          startDate: request.startDate || '',
          endDate: request.endDate || '',
          reason: request.reason || '',
          company: request.company || 'Unknown',
          type: request.type || 'Full day',
          isHalfDay: request.isHalfDay || false,
          halfDayType: request.halfDayType || null,
          durationDays: request.durationDays || 1,
          createdAt: request.createdAt ? request.createdAt.toDate().toISOString() : new Date().toISOString(),
          locale: 'en'
        };

        const { subject, html, text } = generateAdminNotificationEmail(emailData);
        
        // Send admin notification
        const result = await sendAdminNotification(subject, html, text);
        
        if (result.success) {
          console.log(`✅ Email sent successfully for request #${request.id}`);
          successCount++;
        } else {
          const errorMsg = `Failed to send email for request #${request.id}: ${result.error}`;
          console.log(`❌ ${errorMsg}`);
          errors.push(errorMsg);
          errorCount++;
        }

      } catch (error) {
        const errorMsg = `Error processing request #${request.id}: ${error instanceof Error ? error.message : String(error)}`;
        console.error(`❌ ${errorMsg}`);
        errors.push(errorMsg);
        errorCount++;
      }
    }

    // Summary
    console.log('\n📊 Summary:');
    console.log(`✅ Successfully sent: ${successCount} emails`);
    console.log(`❌ Failed to send: ${errorCount} emails`);
    console.log(`📋 Total processed: ${pendingRequests.length} requests`);

    return NextResponse.json({
      success: true,
      message: `Processed ${pendingRequests.length} pending requests`,
      processedCount: pendingRequests.length,
      successCount,
      errorCount,
      errors: errors.length > 0 ? errors : undefined
    });

  } catch (error) {
    console.error('❌ Fatal error:', error);
    return NextResponse.json({
      success: false,
      error: 'Fatal error occurred',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
