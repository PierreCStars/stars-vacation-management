import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { sendEmailWithFallbacks } from '@/lib/simple-email-service';

export async function GET(request: NextRequest) {
  try {
    console.log('🧪 Testing admin notification email functionality...');
    
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const adminEmails = ['pierre@stars.mc', 'johnny@stars.mc', 'daniel@stars.mc', 'compta@stars.mc'];
    if (!adminEmails.includes(session.user.email)) {
      return NextResponse.json({ error: 'Access denied. Admin privileges required.' }, { status: 403 });
    }

    // Get status from query parameter, default to APPROVED
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'APPROVED';
    
    if (!['APPROVED', 'REJECTED'].includes(status)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid status. Must be APPROVED or REJECTED',
        message: 'Use ?status=APPROVED or ?status=REJECTED in the URL'
      }, { status: 400 });
    }
    
    // Simulate a vacation request review
    const mockRequest = {
      userEmail: 'test@stars.mc',
      userName: 'Test Employee',
      userId: 'test123',
      company: 'Stars MC',
      type: 'Vacation',
      startDate: '2025-01-15',
      endDate: '2025-01-20',
      status: status
    };
    
    const emailSubject = `TEST: Vacation Request ${mockRequest.status} - ${mockRequest.userName}`;
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://stars-vacation-management-dpv42teb7-pierres-projects-bba7ee64.vercel.app';
    
    // Email to admin team (same as the actual notification)
    const adminEmailBody = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>TEST: Vacation Request ${status}</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f8f9fa;
        }
        .email-container {
            background-color: #ffffff;
            border-radius: 12px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            overflow: hidden;
        }
        .header {
            background: linear-gradient(135deg, #D8B11B 0%, #21254B 100%);
            color: white;
            padding: 25px;
            text-align: center;
        }
        .header h1 {
            margin: 0;
            font-size: 24px;
            font-weight: 600;
        }
        .test-banner {
            background-color: #fef3c7;
            border: 2px solid #f59e0b;
            border-radius: 8px;
            padding: 15px;
            margin: 20px 0;
            text-align: center;
        }
        .test-banner h2 {
            margin: 0;
            color: #92400e;
            font-size: 18px;
        }
        .content {
            padding: 25px;
        }
        .summary {
            background-color: #f8f9fa;
            border-radius: 8px;
            padding: 20px;
            margin-bottom: 20px;
        }
        .summary h3 {
            margin: 0 0 15px 0;
            color: #1f2937;
            font-size: 18px;
        }
        .detail-item {
            padding: 8px 0;
            border-bottom: 1px solid #e5e7eb;
        }
        .detail-item:last-child {
            border-bottom: none;
        }
        .detail-label {
            font-weight: 600;
            color: #6b7280;
            display: inline-block;
            width: 120px;
        }
        .footer {
            background-color: #f8f9fa;
            padding: 20px 25px;
            text-align: center;
            border-top: 1px solid #e5e7eb;
        }
        .action-button {
            display: inline-block;
            background-color: #D8B11B;
            color: white;
            text-decoration: none;
            padding: 10px 20px;
            border-radius: 6px;
            font-weight: 600;
            margin: 10px 0;
        }
    </style>
</head>
<body>
    <div class="email-container">
        <div class="header">
            <h1>TEST: Vacation Request ${status}</h1>
        </div>
        
        <div class="content">
            <div class="test-banner">
                <h2>🧪 TEST EMAIL - Admin Notification System</h2>
                <p>This is a test email to verify that admin notifications are working correctly.</p>
            </div>
            
            <p><strong>${session.user.name || session.user.email}</strong> has ${status.toLowerCase()} a vacation request.</p>
            
            <div class="summary">
                <h3>📋 Request Summary</h3>
                <div class="detail-item">
                    <span class="detail-label">Employee:</span>
                    <span>${mockRequest.userName} (${mockRequest.userId})</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Company:</span>
                    <span>${mockRequest.company}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Type:</span>
                    <span>${mockRequest.type}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Start Date:</span>
                    <span>${new Date(mockRequest.startDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">End Date:</span>
                    <span>${new Date(mockRequest.endDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Status:</span>
                    <span><strong>${status}</strong></span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Reviewed By:</span>
                    <span>${session.user.name || session.user.email}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Review Date:</span>
                    <span>${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Test Comment:</span>
                    <span>This is a test comment to verify the admin notification system is working correctly.</span>
                </div>
            </div>
            
            <div style="background-color: #f0f9ff; border: 1px solid #0ea5e9; border-radius: 8px; padding: 15px; margin: 20px 0;">
                <h3 style="margin: 0 0 10px 0; color: #0c4a6e; font-size: 16px;">📧 Email Test Information</h3>
                <p style="margin: 0; color: #0369a1;">
                    <strong>Test Date:</strong> ${new Date().toLocaleString()}<br>
                    <strong>Tested By:</strong> ${session.user.name || session.user.email}<br>
                    <strong>Status Tested:</strong> ${status}<br>
                    <strong>Recipients:</strong> pierre@stars.mc, johnny@stars.mc, daniel@stars.mc, compta@stars.mc
                </p>
            </div>
        </div>
        
        <div class="footer">
            <a href="${baseUrl}/admin/vacation-requests" class="action-button">View All Requests</a>
        </div>
    </div>
</body>
</html>
    `.trim();

    console.log('📧 Sending test admin notification email...');
    console.log('📧 Recipients:', ['pierre@stars.mc', 'johnny@stars.mc', 'daniel@stars.mc', 'compta@stars.mc']);
    console.log('📧 Subject:', emailSubject);
    
    const result = await sendEmailWithFallbacks(['pierre@stars.mc', 'johnny@stars.mc', 'daniel@stars.mc', 'compta@stars.mc'], emailSubject, adminEmailBody);
    
    console.log('📧 Admin notification test result:', result);
    
    // Get the current URL without using request.url
    const currentUrl = `${baseUrl}/api/test-admin-notification`;
    
    return NextResponse.json({
      success: true,
      emailResult: result,
      message: `Admin notification test completed for status: ${mockRequest.status}. Check all admin inboxes for the test email.`,
      testData: {
        recipients: ['pierre@stars.mc', 'johnny@stars.mc', 'daniel@stars.mc', 'compta@stars.mc'],
        subject: emailSubject,
        status: mockRequest.status,
        testedBy: session.user.name || session.user.email,
        testUrls: {
          approved: `${currentUrl}?status=APPROVED`,
          rejected: `${currentUrl}?status=REJECTED`
        }
      }
    });
    
  } catch (error) {
    console.error('❌ Error in admin notification test:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Failed to send test admin notification email'
    }, { status: 500 });
  }
} 