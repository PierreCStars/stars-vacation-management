// Load environment variables
import * as dotenv from 'dotenv';
dotenv.config();

import { sendEmailWithFallbacks } from './src/lib/simple-email-service.js';

async function testEmail() {
  console.log('🧪 Testing email service...');
  
  const adminEmails = ['pierre@stars.mc', 'johnny@stars.mc', 'daniel@stars.mc', 'compta@stars.mc'];
  const testSubject = '🧪 Test Email - Vacation Management System';
  const testBody = `
    <html>
      <body>
        <h2>Test Email</h2>
        <p>This is a test email to verify that the email notification system is working correctly.</p>
        <p><strong>Sent at:</strong> ${new Date().toISOString()}</p>
        <p>If you receive this email, the notification system is working properly.</p>
        <p><strong>Recipients:</strong> ${adminEmails.join(', ')}</p>
      </body>
    </html>
  `;

  console.log('📧 Sending test email to all admins...');
  const result = await sendEmailWithFallbacks(adminEmails, testSubject, testBody);
  console.log('Test email result:', result);
}

testEmail().catch(console.error); 