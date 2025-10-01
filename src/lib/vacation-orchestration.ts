import { emailAdapter } from '@/lib/email';
import { RealCalendarGateway } from '@/lib/calendar/real';
import { FakeCalendarGateway } from '@/lib/calendar/fake';
import { ADMINS } from '../../config/admins';
import { sendAdminNotification, sendEmailToRecipients } from '@/lib/email-notifications';
import { generateAdminNotificationEmail, generateRequestConfirmationEmail } from '@/lib/email-templates';
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
    if (vacationRequestData) {
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
  endIso 
}: {
  requesterEmail: string; 
  requestId: string; 
  decision: 'APPROVED' | 'DENIED'; 
  startIso: string; 
  endIso: string;
}) {
  const mail = emailAdapter();
  const cal = process.env.E2E_USE_FAKE === '1' ? FakeCalendarGateway : RealCalendarGateway;

  // Email to requester
  await mail.send({ 
    type: 'REQUEST_DECISION', 
    to: requesterEmail, 
    requestId, 
    decision 
  });

  // Embedded calendar write (app DB): add or remove depending on decision
  // TODO: persist in your DB

  // Google Calendar
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
}
