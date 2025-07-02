import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Resend } from 'resend';
import { getAllVacationRequests, updateVacationRequestStatus } from '@/lib/vacation-requests';

const resend = new Resend(process.env.RESEND_API_KEY);

async function getVacationRequest(id: string) {
  const vacationRequests = await getAllVacationRequests();
  return vacationRequests.find(req => req.id === id);
}

async function sendStatusEmail(status: 'APPROVED' | 'REJECTED', request: any, comment: string) {
  const subject = `Vacation Request ${status}`;
  const body = `The vacation request for ${request.userName} (${request.userId}) has been ${status.toLowerCase()} by the admin.\n\nAdmin comment: ${comment || 'No comment.'}\n\n(Replace this text with your real message)`;
  
  // Email to admin/compta
  const adminSubject = `Vacation Request ${status}`;
  const adminBody = `The vacation request for ${request.userName} (${request.userId}) has been ${status.toLowerCase()} by the admin.\n\nAdmin comment: ${comment || 'No comment.'}\n\n(Replace this text with your real message)`;
  
  // Email to the employee who submitted the request
  const employeeSubject = `Your Vacation Request has been ${status}`;
  const employeeBody = `Dear ${request.userName},\n\nYour vacation request has been ${status.toLowerCase()}.\n\nRequest Details:\n- Start Date: ${new Date(request.startDate).toLocaleDateString()}\n- End Date: ${new Date(request.endDate).toLocaleDateString()}\n- Type: ${request.type === 'PAID_VACATION' ? 'Paid Vacation' :
           request.type === 'UNPAID_VACATION' ? 'Unpaid Vacation' :
           request.type === 'SICK_LEAVE' ? 'Sick Leave' :
           request.type === 'OTHER' ? 'Other' : request.type}\n- Company: ${request.company}\n- Reason: ${request.reason || 'No reason provided'}\n\nAdmin comment: ${comment || 'No comment provided.'}\n\n(Replace this text with your real message)`;
  
  try {
    // Send email to admins
    await resend.emails.send({
      from: 'Stars Vacation Management <onboarding@resend.dev>',
      to: ['compta@stars.mc', 'pierre@stars.mc'],
      subject: adminSubject,
      html: adminBody.replace(/\n/g, '<br>'),
      text: adminBody,
    });
    
    // Send email to the employee
    await resend.emails.send({
      from: 'Stars Vacation Management <onboarding@resend.dev>',
      to: [request.userId],
      subject: employeeSubject,
      html: employeeBody.replace(/\n/g, '<br>'),
      text: employeeBody,
    });
    
    console.log(`Status emails sent for request ${request.id}: ${status}`);
  } catch (error) {
    console.error('Failed to send status email:', error);
  }
}

export default async function VacationRequestPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await getServerSession();
  if (!session?.user) {
    redirect('/auth/signin?callbackUrl=/admin/vacation-requests');
  }

  const request = await getVacationRequest(params.id);
  if (!request) {
    return <div style={{ color: '#000000' }}>Request not found</div>;
  }

  async function handleDecision(formData: FormData) {
    'use server';
    
    const status = formData.get('status') as 'APPROVED' | 'REJECTED';
    const comment = formData.get('comment') as string || '';

    // Update the request status in persistent storage with reviewer information
    await updateVacationRequestStatus(
      params.id, 
      status, 
      comment, 
      session?.user?.name || 'Unknown',
      session?.user?.email || ''
    );

    console.log(`Vacation request ${params.id} ${status.toLowerCase()}: ${comment}`);
    // Send status email to compta@stars.mc
    await sendStatusEmail(status, request, comment);
    redirect('/admin/vacation-requests');
  }

  return (
    <div style={{ minHeight: '100vh', background: '#FFFFFF', color: '#000000' }}>
      <div style={{ maxWidth: '1024px', margin: '0 auto', padding: '20px' }}>
        {/* Centered Stars Logo */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 32 }}>
          <Image
            src="/stars-logo.png"
            alt="Stars Logo"
            width={40}
            height={40}
            priority
            style={{ height: 40, width: 40, objectFit: 'contain' }}
          />
        </div>
      
        <h1 style={{ fontSize: '24px', fontWeight: 700, marginBottom: 24, textAlign: 'center', color: '#000000' }}>Vacation Request Details</h1>
        
        <div style={{ background: '#fff', boxShadow: '0 4px 32px rgba(0,0,0,0.08)', borderRadius: 16, padding: 24, border: '1px solid #eee' }}>
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#000000', marginBottom: 12 }}>Employee Information</h2>
            <p style={{ color: '#000000', marginBottom: 8 }}>Name: {request.userName}</p>
            <p style={{ color: '#000000' }}>Email: {request.userId}</p>
          </div>

          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#000000', marginBottom: 12 }}>Request Details</h2>
            <p style={{ color: '#000000', marginBottom: 8 }}>Start Date: {new Date(request.startDate).toLocaleDateString()}</p>
            <p style={{ color: '#000000', marginBottom: 8 }}>End Date: {new Date(request.endDate).toLocaleDateString()}</p>
            <p style={{ color: '#000000', marginBottom: 8 }}>Type: {request.type === 'PAID_VACATION' ? 'Paid Vacation' :
                                             request.type === 'UNPAID_VACATION' ? 'Unpaid Vacation' :
                                             request.type === 'SICK_LEAVE' ? 'Sick Leave' :
                                             request.type === 'OTHER' ? 'Other' : request.type}</p>
            <p style={{ color: '#000000', marginBottom: 8 }}>Reason: {request.reason || 'No reason provided'}</p>
            <p style={{ color: '#000000', marginBottom: 8 }}>Company: {request.company}</p>
            <p style={{ color: '#000000' }}>Status: {request.status}</p>
          </div>

          {request.status === 'PENDING' && (
            <div style={{ textAlign: 'center' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#000000', marginBottom: 16 }}>Make a Decision</h2>
              <form action={handleDecision} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <label htmlFor="comment" style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#000000', marginBottom: 8 }}>
                    Comment (optional)
                  </label>
                  <textarea
                    id="comment"
                    name="comment"
                    rows={3}
                    style={{ 
                      width: '100%', 
                      padding: '12px', 
                      border: '1px solid #d1d5db', 
                      borderRadius: 8, 
                      fontSize: '14px',
                      color: '#000000',
                      backgroundColor: '#fff',
                      resize: 'vertical'
                    }}
                  />
                </div>
                
                <div style={{ display: 'flex', gap: 16, justifyContent: 'center' }}>
                  <button
                    type="submit"
                    name="status"
                    value="APPROVED"
                    style={{
                      flex: 1,
                      background: 'linear-gradient(90deg, #22c55e 0%, #059669 100%)',
                      color: '#fff',
                      padding: '12px 24px',
                      borderRadius: 8,
                      border: 'none',
                      fontSize: '14px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'opacity 0.2s'
                    }}
                  >
                    Approve
                  </button>
                  <button
                    type="submit"
                    name="status"
                    value="REJECTED"
                    style={{
                      flex: 1,
                      background: 'linear-gradient(90deg, #ef4444 0%, #dc2626 100%)',
                      color: '#fff',
                      padding: '12px 24px',
                      borderRadius: 8,
                      border: 'none',
                      fontSize: '14px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'opacity 0.2s'
                    }}
                  >
                    Reject
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>

        {/* Back to Requests Button */}
        <div style={{ marginTop: 32, textAlign: 'center' }}>
          <Link 
            href="/admin/vacation-requests"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              padding: '12px 24px',
              border: '1px solid transparent',
              fontSize: '14px',
              fontWeight: 500,
              borderRadius: 8,
              color: '#fff',
              background: 'linear-gradient(90deg, #3b82f6 0%, #6366f1 100%)',
              textDecoration: 'none',
              transition: 'opacity 0.2s'
            }}
          >
            Back to Requests
          </Link>
        </div>
      </div>
    </div>
  );
} 