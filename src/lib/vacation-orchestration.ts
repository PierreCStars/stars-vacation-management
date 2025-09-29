import { emailAdapter } from '@/lib/email';
import { RealCalendarGateway } from '@/lib/calendar/real';
import { FakeCalendarGateway } from '@/lib/calendar/fake';
import { ADMINS } from '../../config/admins';

// On submission:
export async function submitVacation({ 
  requesterEmail, 
  requestId, 
  startIso, 
  endIso 
}: {
  requesterEmail: string; 
  requestId: string; 
  startIso: string; 
  endIso: string;
}) {
  const mail = emailAdapter();

  // Notify admins
  await mail.send({ 
    type: 'ADMIN_NOTIFY', 
    to: ADMINS.map(a => a.email), 
    requestId 
  });
  
  // Confirm to requester
  await mail.send({ 
    type: 'REQUEST_SUBMITTED', 
    to: requesterEmail, 
    requestId 
  });
  
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
