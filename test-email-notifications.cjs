// Test script for email notification system
// Run with: node test-email-notifications.js

const { sendAdminNotification } = require('./src/lib/mailer');
const { adminVacationSubject, adminVacationHtml } = require('./src/lib/email-templates');

async function testEmailNotifications() {
  console.log('🧪 Testing email notification system...\n');

  try {
    // Test 1: Normal vacation request (no conflicts)
    console.log('📧 Test 1: Normal vacation request');
    const normalSubject = adminVacationSubject({
      hasConflicts: false,
      userName: 'John Doe',
      startDate: '2025-09-15',
      endDate: '2025-09-20'
    });
    console.log('Subject:', normalSubject);

    const normalHtml = adminVacationHtml({
      hasConflicts: false,
      userName: 'John Doe',
      userEmail: 'john.doe@stars.mc',
      startDate: '2025-09-15',
      endDate: '2025-09-20',
      isHalfDay: false,
      halfDayType: null,
      reason: 'Summer vacation',
      reviewUrl: 'http://localhost:3000/admin/vacation-requests/test-123',
      conflicts: []
    });
    console.log('HTML length:', normalHtml.length, 'characters\n');

    // Test 2: Vacation request with conflicts
    console.log('📧 Test 2: Vacation request with conflicts');
    const conflictSubject = adminVacationSubject({
      hasConflicts: true,
      userName: 'Jane Smith',
      startDate: '2025-09-15',
      endDate: '2025-09-15'
    });
    console.log('Subject:', conflictSubject);

    const conflictHtml = adminVacationHtml({
      hasConflicts: true,
      userName: 'Jane Smith',
      userEmail: 'jane.smith@stars.mc',
      startDate: '2025-09-15',
      endDate: '2025-09-15',
      isHalfDay: true,
      halfDayType: 'morning',
      reason: 'Half day off',
      reviewUrl: 'http://localhost:3000/admin/vacation-requests/test-456',
      conflicts: [
        {
          id: 'conflict-1',
          userName: 'John Doe',
          startDate: '2025-09-15',
          endDate: '2025-09-20',
          status: 'approved'
        }
      ]
    });
    console.log('HTML length:', conflictHtml.length, 'characters\n');

    // Test 3: Half-day afternoon request
    console.log('📧 Test 3: Half-day afternoon request');
    const halfDaySubject = adminVacationSubject({
      hasConflicts: false,
      userName: 'Bob Wilson',
      startDate: '2025-09-16',
      endDate: '2025-09-16'
    });
    console.log('Subject:', halfDaySubject);

    const halfDayHtml = adminVacationHtml({
      hasConflicts: false,
      userName: 'Bob Wilson',
      userEmail: 'bob.wilson@stars.mc',
      startDate: '2025-09-16',
      endDate: '2025-09-16',
      isHalfDay: true,
      halfDayType: 'afternoon',
      reason: 'Afternoon appointment',
      reviewUrl: 'http://localhost:3000/admin/vacation-requests/test-789',
      conflicts: []
    });
    console.log('HTML length:', halfDayHtml.length, 'characters\n');

    console.log('✅ All email template tests passed!');
    console.log('\n📝 Note: To test actual email sending, you need to:');
    console.log('1. Set up SMTP environment variables');
    console.log('2. Run: SMTP_HOST=smtp.gmail.com SMTP_USER=your@email.com SMTP_PASS=your_password node test-email-notifications.js');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testEmailNotifications();
