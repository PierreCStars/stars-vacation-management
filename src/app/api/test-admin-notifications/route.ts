import { NextResponse } from 'next/server';
import { getFirebaseAdmin } from '@/lib/firebaseAdmin';
import { sendAdminNotification } from '@/lib/email-notifications';
import { generateAdminNotificationEmail } from '@/lib/email-templates';

export const dynamic = "force-dynamic";
export const runtime = 'nodejs';

export async function POST() {
  try {
    console.log('🧪 Testing admin notifications for pending requests...');

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

    // Get all vacation requests and filter for pending ones
    console.log('🔍 Fetching all vacation requests...');
    const snapshot = await db
      .collection('vacationRequests')
      .get();

    const allRequests = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as any[];

    // Filter for pending requests
    const pendingRequests = allRequests.filter(request => request.status === 'pending');

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
        console.log(`📧 Sending admin notification for request ${request.id}...`);
        
        // Prepare vacation request data for email
        const vacationRequestData = {
          id: request.id,
          userName: request.userName || 'Unknown',
          userEmail: request.userEmail || 'unknown@stars.mc',
          startDate: request.startDate,
          endDate: request.endDate,
          reason: request.reason || 'No reason provided',
          company: request.company || 'Unknown',
          type: request.type || 'Full day',
          isHalfDay: request.isHalfDay || false,
          halfDayType: request.halfDayType || null,
          durationDays: request.durationDays || 1,
          createdAt: typeof request.createdAt === 'string' 
            ? request.createdAt 
            : request.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
          locale: 'en'
        };

        // Generate admin notification email
        const adminEmail = generateAdminNotificationEmail(vacationRequestData);
        
        // Send admin notification
        const result = await sendAdminNotification(
          adminEmail.subject,
          adminEmail.html,
          adminEmail.text
        );

        if (result.success) {
          console.log(`✅ Admin notification sent successfully for request ${request.id}`, {
            provider: result.provider,
            messageId: result.messageId
          });
          successCount++;
        } else {
          console.error(`❌ Failed to send admin notification for request ${request.id}:`, result.error);
          errorCount++;
          errors.push(`Request ${request.id}: ${result.error}`);
        }

      } catch (error) {
        console.error(`❌ Error processing request ${request.id}:`, error);
        errorCount++;
        errors.push(`Request ${request.id}: ${error instanceof Error ? error.message : String(error)}`);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Processed ${pendingRequests.length} pending requests`,
      processedCount: pendingRequests.length,
      successCount,
      errorCount,
      errors: errors.length > 0 ? errors : undefined
    });

  } catch (error) {
    console.error('❌ Error in test admin notifications:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to test admin notifications',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
