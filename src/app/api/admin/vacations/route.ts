import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { isAdmin } from '@/config/admins';
import { getFirebaseAdmin } from '@/lib/firebaseAdmin';
import { normalizeVacationFields } from '@/lib/normalize-vacation-fields';
import { sendEmailToRecipients } from '@/lib/email-notifications';
import { getTranslations } from 'next-intl/server';
import { getVacationTypeLabelFromTranslations } from '@/lib/vacation-types';
import { renderSlgEmail } from '@/lib/email/slg-theme';

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check admin permissions
    if (!isAdmin(session.user.email)) {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
    }

    // Parse request body
    const body = await request.json();
    const {
      firstName,
      lastName,
      phone,
      email,
      companyId,
      startDate,
      endDate,
      vacationType
    } = body;

    // Validate required fields
    if (!firstName || !lastName || !phone || !companyId || !startDate || !endDate || !vacationType) {
      return NextResponse.json({ 
        error: 'Missing required fields: firstName, lastName, phone, companyId, startDate, endDate, vacationType' 
      }, { status: 400 });
    }

    // Validate date range
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (start > end) {
      return NextResponse.json({ 
        error: 'Start date must be before or equal to end date' 
      }, { status: 400 });
    }

    // Validate email format if provided
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ 
        error: 'Invalid email format' 
      }, { status: 400 });
    }

    // Validate phone format (basic validation)
    if (!phone || phone.trim().length === 0) {
      return NextResponse.json({ 
        error: 'Phone number is required' 
      }, { status: 400 });
    }

    // Get Firebase admin
    const { db, error } = getFirebaseAdmin();
    if (error || !db) {
      console.error('❌ Firebase Admin not available:', error);
      return NextResponse.json({ 
        error: 'Firebase not available', 
        details: error 
      }, { status: 500 });
    }

    // Calculate duration
    const durationDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    // Create user identity - prefer email if provided, otherwise use name + company
    const userId = email || `${firstName.toLowerCase()}.${lastName.toLowerCase()}@${companyId.toLowerCase()}.mc`;
    const userName = `${firstName} ${lastName}`;

    // Check if this is a test user request
    const isTestUser = email === 'test@stars.mc' || userId === 'test@stars.mc';

    // Test-user requests stay PENDING so they can be validated/rejected during
    // QA. Real admin-created vacations are validated on the spot (approved).
    const normalizedFields = normalizeVacationFields({
      status: isTestUser ? 'pending' : 'approved',
      type: vacationType
    });

    // Prepare vacation request data. NB: use null (never undefined) for empty
    // fields — the Firestore Admin SDK rejects undefined values.
    const vacationRequest = {
      userId,
      userEmail: email || userId,
      userName,
      startDate,
      endDate,
      reason: isTestUser ? 'Test vacation request (auto-deleted after 24h)' : 'Created by admin',
      company: companyId,
      type: normalizedFields.type || vacationType,
      status: normalizedFields.status || (isTestUser ? 'Pending' : 'Approved'),
      createdAt: new Date(),
      updatedAt: new Date(),
      // A pending test request has not been reviewed yet.
      reviewedAt: isTestUser ? null : new Date(),
      reviewedBy: isTestUser ? null : (session.user.name || 'Admin'),
      reviewerEmail: isTestUser ? null : session.user.email,
      adminComment: isTestUser ? 'Test request - will be auto-deleted after 24 hours' : 'Created and validated by admin',
      isHalfDay: false,
      halfDayType: null,
      durationDays,
      createdByAdminId: session.user.email, // Track who created it
      createdByAdminName: session.user.name || 'Admin',
      isTestUser: isTestUser, // Flag to identify test requests (kept out of archives)
      testUserCreatedAt: isTestUser ? new Date() : null // Track creation time for auto-deletion
    };

    // Save to Firestore
    const docRef = await db.collection('vacationRequests').add(vacationRequest);
    const requestId = docRef.id;
    console.log(`✅ Admin-created vacation request saved with ID: ${requestId}`);

    // Send email notification if email is provided (never for test users —
    // a pending test request must not trigger a "validated" confirmation).
    let emailSent = false;
    if (email && !isTestUser) {
      try {
        // Detect locale from request headers or default to English
        const locale = request.headers.get('accept-language')?.includes('fr') ? 'fr' : 
                     request.headers.get('accept-language')?.includes('it') ? 'it' : 'en';

        // Get translations for the email template
        const t = await getTranslations({ locale, namespace: 'emails.adminCreatedVacation' });
        const tVacations = await getTranslations({ locale, namespace: 'vacations' });

        // Format dates and get vacation type label
        const formattedStartDate = new Date(startDate).toLocaleDateString(locale);
        const formattedEndDate = new Date(endDate).toLocaleDateString(locale);
        const vacationTypeLabel = getVacationTypeLabelFromTranslations(vacationType, tVacations);

        // Create email content
        const subject = t('subject');
        const detailLine = (s: string) =>
          `<tr><td style="padding:5px 0;font-size:14px;color:#0A0A0A;border-bottom:1px solid rgba(10,10,10,0.06);">${s}</td></tr>`;
        const bodyHtml =
          `<tr><td style="padding:0 0 16px;">${t('body')}</td></tr>` +
          detailLine(t('type', { type: vacationTypeLabel })) +
          detailLine(t('dates', { startDate: formattedStartDate, endDate: formattedEndDate })) +
          detailLine(t('duration', { duration: durationDays })) +
          detailLine(t('createdBy', { createdBy: session.user.name || 'Admin' })) +
          `<tr><td style="padding:16px 0 0;font-size:12px;color:#273341;">${t('footer')}</td></tr>`;

        const htmlBody = renderSlgEmail({
          title: subject,
          heading: t('greeting', { name: userName }),
          accent: 'green',
          bodyHtml,
        });

        const textBody = `
${t('greeting', { name: userName })}

${t('body')}

${t('details')}
${t('type', { type: vacationTypeLabel })}
${t('dates', { startDate: formattedStartDate, endDate: formattedEndDate })}
${t('duration', { duration: durationDays })}
${t('reason', { reason: 'Created by admin' })}
${t('createdBy', { createdBy: session.user.name || 'Admin' })}

${t('footer')}

${t('signature')}
        `;

        await sendEmailToRecipients(
          [email],
          subject,
          htmlBody,
          textBody
        );
        
        emailSent = true;
        console.log(`✅ Admin-created vacation notification sent to ${email}`);
      } catch (emailError) {
        console.error('❌ Failed to send admin-created vacation notification:', emailError);
        // Don't fail the request if email fails
      }
    }

    // Log audit trail
    console.log(`📋 Admin vacation creation audit:`, {
      adminId: session.user.email,
      adminName: session.user.name,
      employeeName: userName,
      employeeEmail: email || 'No email provided',
      company: companyId,
      startDate,
      endDate,
      vacationType,
      requestId,
      emailSent,
      timestamp: new Date().toISOString()
    });

    return NextResponse.json({ 
      success: true, 
      id: requestId,
      emailSent,
      message: 'Vacation created and validated successfully' 
    });

  } catch (error) {
    console.error('❌ Error creating admin vacation:', error);
    return NextResponse.json(
      { error: 'Failed to create vacation request' },
      { status: 500 }
    );
  }
}
