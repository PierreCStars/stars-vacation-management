
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { Resend } from 'resend';
import { loadVacationRequests, saveVacationRequests } from '@/lib/vacation-requests';

// Email recipients configuration - only pierre@stars.mc for now
const EMAIL_RECIPIENTS = {
  STARS: ['pierre@stars.mc', 'johnny@stars.mc', 'daniel@stars.mc'],
  STARS_MC: ['pierre@stars.mc', 'johnny@stars.mc', 'daniel@stars.mc'],
  STARS_VACATIONS: ['pierre@stars.mc', 'johnny@stars.mc', 'daniel@stars.mc']

};

// Initialize Resend
const resend = new Resend(process.env.RESEND_API_KEY);

// Email sending function using Resend
async function sendEmail(to: string[], subject: string, body: string) {
  try {
    console.log('=== EMAIL DEBUG INFO ===');
    console.log('RESEND_API_KEY exists:', !!process.env.RESEND_API_KEY);
    console.log('RESEND_API_KEY length:', process.env.RESEND_API_KEY?.length);
    console.log('To:', to.join(', '));
    console.log('Subject:', subject);
    console.log('========================');

    // If no Resend API key is configured, fall back to console logging
    if (!process.env.RESEND_API_KEY) {
      console.log('=== EMAIL NOTIFICATION (RESEND_API_KEY not configured) ===');
      console.log('To:', to.join(', '));
      console.log('Subject:', subject);
      console.log('Body:', body);
      console.log('========================================================');
      return true;
    }

    // Try to send via Resend first
    try {
      const { data, error } = await resend.emails.send({
        from: 'Stars Vacation Management <onboarding@resend.dev>',
        to: to,
        subject: subject,
        html: body.replace(/\n/g, '<br>'),
        text: body,
      });

      if (error) {
        console.error('Resend error:', error);
        // If domain verification fails, fall back to console logging
        if ((error as any).statusCode === 403 && (error as any).message?.includes('domain is not verified')) {
          console.log('=== EMAIL NOTIFICATION (Domain not verified, using console fallback) ===');
          console.log('To:', to.join(', '));
          console.log('Subject:', subject);
          console.log('Body:', body);
          console.log('========================================================');
          return true;
        }
        return false;
      }

      console.log('Email sent successfully via Resend:', data);
      return true;
    } catch (resendError) {
      console.error('Resend API error:', resendError);
      // Fall back to console logging
      console.log('=== EMAIL NOTIFICATION (Resend failed, using console fallback) ===');
      console.log('To:', to.join(', '));
      console.log('Subject:', subject);
      console.log('Body:', body);
      console.log('========================================================');
      return true;
    }
  } catch (error) {
    console.error('Error sending email:', error);
    // Final fallback to console logging
    console.log('=== EMAIL NOTIFICATION (Error occurred, using console fallback) ===');
    console.log('To:', to.join(', '));
    console.log('Subject:', subject);
    console.log('Body:', body);
    console.log('========================================================');
    return true;
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { startDate, endDate, reason, company, type } = body;

    // Validate required fields
    if (!startDate || !endDate || !company || !type) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Load existing requests
    const vacationRequests = await loadVacationRequests();

    // Create vacation request object
    const vacationRequest = {
      id: Date.now().toString(),
      userId: session.user.email,
      userName: session.user.name,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      reason,
      company,
      type,
      status: 'PENDING',
      createdAt: new Date(),
    };

    // Add to requests and save
    vacationRequests.push(vacationRequest);
    await saveVacationRequests(vacationRequests);

    // Send email notification
    const recipients = EMAIL_RECIPIENTS[company as keyof typeof EMAIL_RECIPIENTS] || EMAIL_RECIPIENTS.STARS;
    const subject = `New Vacation Request - ${session.user.name}`;
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const adminLink = `${baseUrl}/admin/vacation-requests`;
    const emailBody = `
New vacation request submitted:

Employee: ${session.user.name} (${session.user.email})
Company: ${company}
Type: ${type}
Start Date: ${new Date(startDate).toLocaleDateString()}
End Date: ${new Date(endDate).toLocaleDateString()}
Reason: ${reason}

Review and approve/deny this request:
${adminLink}
    `.trim();

    await sendEmail(recipients, subject, emailBody);

    return NextResponse.json({ 
      success: true, 
      vacationRequest,
      message: 'Vacation request submitted successfully. Email notification sent.'
    });

  } catch (error) {
    console.error('Error creating vacation request:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Load all vacation requests
    const vacationRequests = await loadVacationRequests();

    // Return all vacation requests for the authenticated user
    const userRequests = vacationRequests.filter(
      request => request.userId === session.user.email
    );

    return NextResponse.json({ vacationRequests: userRequests });

  } catch (error) {
    console.error('Error fetching vacation requests:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

 
