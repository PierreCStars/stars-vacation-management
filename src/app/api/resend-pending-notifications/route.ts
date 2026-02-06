import { NextRequest, NextResponse } from 'next/server';
import { getFirebaseAdmin } from '@/lib/firebase-admin';
import { generateAdminNotificationEmail } from '@/lib/email-templates';
import { sendAdminNotification } from '@/lib/email-notifications';

export const revalidate = 0;

export async function POST(request: NextRequest) {
  try {
    console.log('📧 Resending notification emails for pending vacation requests...');

    // Get Firebase admin
    const { db, error } = getFirebaseAdmin();
    if (error || !db) {
      console.error('❌ Firebase Admin not available:', error);
      return NextResponse.json({ 
        error: 'Firebase not available', 
        details: error 
      }, { status: 500 });
    }

    // Get all pending vacation requests
    // Note: Status is stored as 'Pending' (capitalized) in the database
    const snapshot = await db.collection('vacationRequests')
      .where('status', '==', 'Pending')
      .get();

    if (snapshot.empty) {
      console.log('ℹ️ No pending vacation requests found');
      return NextResponse.json({
        success: true,
        message: 'No pending vacation requests found',
        processed: 0,
        sent: 0,
        errors: 0
      });
    }

    console.log(`📋 Found ${snapshot.docs.length} pending vacation requests`);

    let sentCount = 0;
    let errorCount = 0;
    const errors: string[] = [];

    for (const doc of snapshot.docs) {
      try {
        const data = doc.data();
        const requestId = doc.id;

        console.log(`📧 Processing request ${requestId} for ${data.userName} (${data.userEmail})`);

        // Prepare vacation request data for email template
        const vacationRequestData = {
          id: requestId,
          userName: data.userName || 'Unknown Employee',
          userEmail: data.userEmail || data.userId || 'unknown@example.com',
          startDate: data.startDate,
          endDate: data.endDate,
          reason: data.reason || 'No reason provided',
          company: data.company || 'Unknown Company',
          type: data.type || 'Full day',
          isHalfDay: data.isHalfDay || false,
          halfDayType: data.halfDayType || null,
          durationDays: data.durationDays || 1,
          createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
          locale: 'en' // Default to English for now
        };

        // Generate admin notification email
        const { subject, html, text } = generateAdminNotificationEmail(vacationRequestData);

        // Send admin notification
        const result = await sendAdminNotification(subject, html, text);

        if (result.success) {
          console.log(`✅ Notification sent for request ${requestId}`, { 
            provider: result.provider, 
            messageId: result.messageId 
          });
          sentCount++;
        } else {
          console.error(`❌ Failed to send notification for request ${requestId}:`, result.error);
          errorCount++;
          errors.push(`Request ${requestId}: ${result.error}`);
        }

        // Add a small delay to avoid overwhelming the email service
        await new Promise(resolve => setTimeout(resolve, 100));

      } catch (error) {
        console.error(`❌ Error processing request ${doc.id}:`, error);
        errorCount++;
        errors.push(`Request ${doc.id}: ${error instanceof Error ? error.message : String(error)}`);
      }
    }

    const result = {
      success: true,
      message: `Processed ${snapshot.docs.length} pending vacation requests`,
      processed: snapshot.docs.length,
      sent: sentCount,
      errors: errorCount,
      errorDetails: errors
    };

    console.log('📊 Resend notification summary:', result);

    return NextResponse.json(result);

  } catch (error) {
    console.error('❌ Error resending notification emails:', error);
    return NextResponse.json({ 
      error: 'Failed to resend notification emails',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    console.log('📋 Checking pending vacation requests...');

    // Get Firebase admin
    const { db, error } = getFirebaseAdmin();
    if (error || !db) {
      console.error('❌ Firebase Admin not available:', error);
      return NextResponse.json({ 
        error: 'Firebase not available', 
        details: error 
      }, { status: 500 });
    }

    // Get all pending vacation requests
    // Note: Status is stored as 'Pending' (capitalized) in the database
    const snapshot = await db.collection('vacationRequests')
      .where('status', '==', 'Pending')
      .get();

    // Sort in memory by createdAt descending
    const pendingRequests = snapshot.docs
      .map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          userName: data.userName || 'Unknown Employee',
          userEmail: data.userEmail || data.userId || 'unknown@example.com',
          startDate: data.startDate,
          endDate: data.endDate,
          reason: data.reason || 'No reason provided',
          company: data.company || 'Unknown Company',
          type: data.type || 'Full day',
          createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
          durationDays: data.durationDays || 1
        };
      })
      .sort((a, b) => {
        const dateA = new Date(a.createdAt).getTime();
        const dateB = new Date(b.createdAt).getTime();
        return dateB - dateA; // Descending order
      });

    return NextResponse.json({
      success: true,
      count: pendingRequests.length,
      requests: pendingRequests
    });

  } catch (error) {
    console.error('❌ Error checking pending vacation requests:', error);
    return NextResponse.json({ 
      error: 'Failed to check pending vacation requests',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
