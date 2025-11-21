import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { isAdmin } from '@/config/admins';
import { getFirebaseAdmin } from '@/lib/firebaseAdmin';
import { normalizeVacationFields } from '@/lib/normalize-vacation-fields';
import { sendEmailToRecipients } from '@/lib/email-notifications';
import { getTranslations } from 'next-intl/server';
import { getVacationTypeLabelFromTranslations } from '@/lib/vacation-types';

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

    // Normalize status and type to canonical values
    const normalizedFields = normalizeVacationFields({
      status: 'approved', // Set as approved since admin is validating it
      type: vacationType
    });
    
    // Prepare vacation request data
    const vacationRequest = {
      userId,
      userEmail: email || userId,
      userName,
      startDate,
      endDate,
      reason: isTestUser ? 'Test vacation request (auto-deleted after 24h)' : 'Created by admin',
      company: companyId,
      type: normalizedFields.type || vacationType,
      status: normalizedFields.status || 'Approved',
      createdAt: new Date(),
      updatedAt: new Date(),
      reviewedAt: new Date(),
      reviewedBy: session.user.name || 'Admin',
      reviewerEmail: session.user.email,
      adminComment: isTestUser ? 'Test request - will be auto-deleted after 24 hours' : 'Created and validated by admin',
      isHalfDay: false,
      halfDayType: null,
      durationDays,
      createdByAdminId: session.user.email, // Track who created it
      createdByAdminName: session.user.name || 'Admin',
      isTestUser: isTestUser, // Flag to identify test requests
      testUserCreatedAt: isTestUser ? new Date() : undefined // Track creation time for auto-deletion
    };

    // Save to Firestore
    const docRef = await db.collection('vacationRequests').add(vacationRequest);
    const requestId = docRef.id;
    console.log(`✅ Admin-created vacation request saved with ID: ${requestId}`);

    // Send email notification if email is provided
    let emailSent = false;
    if (email) {
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
        const htmlBody = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #059669;">
              ${t('greeting', { name: userName })}
            </h2>
            
            <p style="font-size: 16px; line-height: 1.6; color: #374151;">
              ${t('body')}
            </p>
            
            <div style="background-color: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #059669;">
              <h3 style="color: #111827; margin-top: 0;">${t('details')}</h3>
              <ul style="list-style: none; padding: 0;">
                <li style="margin: 8px 0;"><strong>${t('type', { type: vacationTypeLabel })}</strong></li>
                <li style="margin: 8px 0;"><strong>${t('dates', { startDate: formattedStartDate, endDate: formattedEndDate })}</strong></li>
                <li style="margin: 8px 0;"><strong>${t('duration', { duration: durationDays })}</strong></li>
                <li style="margin: 8px 0;"><strong>${t('reason', { reason: 'Created by admin' })}</strong></li>
                <li style="margin: 8px 0;"><strong>${t('createdBy', { createdBy: session.user.name || 'Admin' })}</strong></li>
              </ul>
            </div>
            
            <p style="font-size: 14px; color: #6b7280;">
              ${t('footer')}
            </p>
            
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
              <p style="font-size: 14px; color: #374151;">
                ${t('signature')}
              </p>
            </div>
          </div>
        `;

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
