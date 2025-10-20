import { emailAdapter } from '@/lib/email';
import { RealCalendarGateway } from '@/lib/calendar/real';
import { FakeCalendarGateway } from '@/lib/calendar/fake';
import { ADMINS } from '@/config/admins';
import { sendAdminNotification, sendEmailToRecipients, getAdminEmails } from '@/lib/email-notifications';
import { generateAdminNotificationEmail, generateRequestConfirmationEmail, generateDecisionEmail, generateAdminReviewNotificationEmail } from '@/lib/email-templates';
import { sendLocalizedEmail } from '@/lib/localized-email-service';
import type { VacationRequestData } from '@/lib/email-templates';

// On submission:
export async function submitVacation({ 
  requesterEmail, 
  requestId, 
  startIso, 
  endIso,
  vacationRequestData
}: {
  requesterEmail: string; 
  requestId: string; 
  startIso: string; 
  endIso: string;
  vacationRequestData?: VacationRequestData;
}) {
  console.log('📧 Sending vacation request notifications...', { requestId, requesterEmail });

  try {
    // Send admin notification with deep link
    if (vacationRequestData) {
      const adminEmail = generateAdminNotificationEmail(vacationRequestData);
      const adminResult = await sendAdminNotification(adminEmail.subject, adminEmail.html, adminEmail.text);
      
      if (adminResult.success) {
        console.log('✅ Admin notification sent successfully', { provider: adminResult.provider, messageId: adminResult.messageId });
      } else {
        console.error('❌ Failed to send admin notification:', adminResult.error);
      }
    } else {
      // Fallback to old system if no detailed data available
      console.log('⚠️ Using fallback email system (no detailed data)');
      const mail = emailAdapter();
      await mail.send({ 
        type: 'ADMIN_NOTIFY', 
        to: ADMINS.map(a => a.email), 
        requestId 
      });
    }
    
    // Send confirmation to requester
    if (vacationRequestData && vacationRequestData.locale) {
      // Use localized email service for confirmation
      try {
        await sendLocalizedEmail(
          'submissionConfirmation',
          vacationRequestData as any, // Cast to include locale
          [requesterEmail]
        );
        console.log('✅ Localized confirmation email sent successfully');
      } catch (error) {
        console.error('❌ Failed to send localized confirmation email:', error);
        // Fallback to non-localized email
        const confirmationEmail = generateRequestConfirmationEmail(vacationRequestData);
        const confirmationResult = await sendEmailToRecipients(
          [requesterEmail],
          confirmationEmail.subject, 
          confirmationEmail.html, 
          confirmationEmail.text
        );
        
        if (confirmationResult.success) {
          console.log('✅ Fallback confirmation email sent successfully', { provider: confirmationResult.provider, messageId: confirmationResult.messageId });
        } else {
          console.error('❌ Failed to send fallback confirmation email:', confirmationResult.error);
        }
      }
    } else if (vacationRequestData) {
      // Fallback to non-localized email if no locale
      const confirmationEmail = generateRequestConfirmationEmail(vacationRequestData);
      const confirmationResult = await sendEmailToRecipients(
        [requesterEmail],
        confirmationEmail.subject, 
        confirmationEmail.html, 
        confirmationEmail.text
      );
      
      if (confirmationResult.success) {
        console.log('✅ Confirmation email sent successfully', { provider: confirmationResult.provider, messageId: confirmationResult.messageId });
      } else {
        console.error('❌ Failed to send confirmation email:', confirmationResult.error);
      }
    } else {
      // Fallback to old system
      const mail = emailAdapter();
      await mail.send({ 
        type: 'REQUEST_SUBMITTED', 
        to: requesterEmail, 
        requestId 
      });
    }
    
    console.log('✅ Vacation request email notifications completed');
  } catch (error) {
    console.error('❌ Error sending vacation request emails:', error);
    throw error;
  }
  
  // Persist request in DB with status 'PENDING' and local embedded calendar entry
  // (Write to your app's embedded calendar store / DB table)
  // TODO: Add embedded calendar write here
}

// On decision:
export async function decideVacation({ 
  requesterEmail, 
  requestId, 
  decision, 
  startIso, 
  endIso,
  vacationRequestData,
  adminComment,
  reviewedBy
}: {
  requesterEmail: string; 
  requestId: string; 
  decision: 'APPROVED' | 'DENIED'; 
  startIso: string; 
  endIso: string;
  vacationRequestData?: VacationRequestData;
  adminComment?: string;
  reviewedBy?: string;
}) {
  console.log('📧 Sending vacation decision notification...', { requestId, requesterEmail, decision });

  try {
    // Send decision email to requester
    if (vacationRequestData && vacationRequestData.locale) {
      // Use localized email service for decision
      try {
        const templateKey = decision.toLowerCase() === 'approved' ? 'approvalNotice' : 'denialNotice';
        await sendLocalizedEmail(
          templateKey,
          {
            ...vacationRequestData,
            decision: decision.toLowerCase() as 'approved' | 'denied',
            approvedBy: decision.toLowerCase() === 'approved' ? reviewedBy : undefined,
            deniedBy: decision.toLowerCase() === 'denied' ? reviewedBy : undefined,
            adminComment
          } as any, // Cast to include locale
          [requesterEmail]
        );
        console.log('✅ Localized decision email sent successfully');
      } catch (error) {
        console.error('❌ Failed to send localized decision email:', error);
        // Fallback to non-localized email
        const decisionEmail = generateDecisionEmail({
          ...vacationRequestData,
          decision: decision.toLowerCase() as 'approved' | 'denied',
          adminComment,
          reviewedBy
        });
        
        const decisionResult = await sendEmailToRecipients(
          [requesterEmail],
          decisionEmail.subject,
          decisionEmail.html,
          decisionEmail.text
        );
        
        if (decisionResult.success) {
          console.log('✅ Fallback decision email sent successfully', { provider: decisionResult.provider, messageId: decisionResult.messageId });
        } else {
          console.error('❌ Failed to send fallback decision email:', decisionResult.error);
        }
      }
    } else if (vacationRequestData) {
      // Fallback to non-localized email if no locale
      const decisionEmail = generateDecisionEmail({
        ...vacationRequestData,
        decision: decision.toLowerCase() as 'approved' | 'denied',
        adminComment,
        reviewedBy
      });
      
      const decisionResult = await sendEmailToRecipients(
        [requesterEmail],
        decisionEmail.subject,
        decisionEmail.html,
        decisionEmail.text
      );
      
      if (decisionResult.success) {
        console.log('✅ Decision email sent successfully', { provider: decisionResult.provider, messageId: decisionResult.messageId });
      } else {
        console.error('❌ Failed to send decision email:', decisionResult.error);
      }
    } else {
      // Fallback to old system
      console.log('⚠️ Using fallback email system (no detailed data)');
      const mail = emailAdapter();
      await mail.send({ 
        type: 'REQUEST_DECISION', 
        to: requesterEmail, 
        requestId, 
        decision 
      });
    }

    // Send admin-to-admin notification (exclude the reviewer from the notification)
    if (vacationRequestData && reviewedBy) {
      try {
        const adminEmails = getAdminEmails();
        const otherAdmins = adminEmails.filter(email => 
          email.toLowerCase() !== reviewedBy.toLowerCase()
        );
        
        if (otherAdmins.length > 0) {
          const adminReviewEmail = generateAdminReviewNotificationEmail({
            ...vacationRequestData,
            decision: decision.toLowerCase() as 'approved' | 'denied',
            reviewedBy,
            reviewerEmail: reviewedBy, // Assuming reviewedBy is the email
            reviewedAt: new Date().toISOString(),
            adminComment
          });
          
          const adminReviewResult = await sendEmailToRecipients(
            otherAdmins,
            adminReviewEmail.subject,
            adminReviewEmail.html,
            adminReviewEmail.text
          );
          
          if (adminReviewResult.success) {
            console.log('✅ Admin-to-admin notification sent successfully', { 
              provider: adminReviewResult.provider, 
              messageId: adminReviewResult.messageId,
              recipients: otherAdmins.length
            });
          } else {
            console.error('❌ Failed to send admin-to-admin notification:', adminReviewResult.error);
          }
        } else {
          console.log('ℹ️ No other admins to notify (only reviewer in admin list)');
        }
      } catch (error) {
        console.error('❌ Error sending admin-to-admin notification:', error);
        // Don't fail the main process if admin notification fails
      }
    }

    // Embedded calendar write (app DB): add or remove depending on decision
    // TODO: persist in your DB

    // Google Calendar
    const cal = process.env.E2E_USE_FAKE === '1' ? FakeCalendarGateway : RealCalendarGateway;
    if (decision === 'APPROVED') {
      await cal.createEvent({
        requestId,
        start: startIso,
        end: endIso,
        summary: `Vacation — ${requesterEmail}`,
        description: `Request ${requestId}`,
      });
    } else {
      await cal.deleteEventByRequestId(requestId);
    }
    
    console.log('✅ Vacation decision processing completed');
  } catch (error) {
    console.error('❌ Error processing vacation decision:', error);
    throw error;
  }
}
