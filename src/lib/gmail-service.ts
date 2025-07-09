import { google } from 'googleapis';

// Gmail API configuration
const GMAIL_SCOPES = ['https://www.googleapis.com/auth/gmail.send'];

// Initialize Gmail API
let gmail: any = null;

try {
  if (process.env.GOOGLE_SERVICE_ACCOUNT_KEY) {
    console.log('🔧 Initializing Gmail API...');
    
    // Parse the service account key
    let credentials;
    try {
      credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY);
    } catch (parseError) {
      const errorMessage = parseError instanceof Error ? parseError.message : 'Unknown parsing error';
      console.error('❌ Failed to parse GOOGLE_SERVICE_ACCOUNT_KEY:', errorMessage);
      console.log('💡 Make sure the key is properly formatted as a JSON string');
      throw parseError;
    }
    
    // Validate required fields
    if (!credentials.client_email) {
      throw new Error('Service account key missing client_email field');
    }
    if (!credentials.private_key) {
      throw new Error('Service account key missing private_key field');
    }
    
    console.log('✅ Service account key parsed successfully');
    console.log('📧 Client email:', credentials.client_email);
    
    const auth = new google.auth.JWT({
      email: credentials.client_email,
      key: credentials.private_key,
      scopes: GMAIL_SCOPES,
      subject: 'pierre@stars.mc' // Use domain-wide delegation
    });
    
    gmail = google.gmail({ version: 'v1', auth });
    console.log('✅ Gmail API initialized successfully');
  } else {
    console.log('⚠️  GOOGLE_SERVICE_ACCOUNT_KEY not found in environment variables');
  }
} catch (error) {
  console.error('❌ Failed to initialize Gmail API:', error);
  console.log('💡 Please check your service account key configuration');
}

// Email sending function using Gmail API
export async function sendEmail(to: string[], subject: string, body: string) {
  try {
    console.log('=== GMAIL EMAIL DEBUG INFO ===');
    console.log('Gmail API configured:', !!gmail);
    console.log('To:', to.join(', '));
    console.log('Subject:', subject);
    console.log('========================');

    // If no Gmail API is configured, fall back to console logging
    if (!gmail) {
      console.log('=== EMAIL NOTIFICATION (Gmail API not configured) ===');
      console.log('To:', to.join(', '));
      console.log('Subject:', subject);
      console.log('Body:', body);
      console.log('========================================================');
      return true;
    }

    // Create email message - use service account email directly
    const fromEmail = 'vacation-db@holiday-461710.iam.gserviceaccount.com';
    const message = createEmailMessage(fromEmail, to, subject, body);

    try {
      // Send email via Gmail API
      const response = await gmail.users.messages.send({
        userId: 'me',
        requestBody: {
          raw: message,
        },
      });

      console.log('Email sent successfully via Gmail API:', response.data);
      return true;
    } catch (gmailError) {
      console.error('Gmail API error:', gmailError);
      
      // If Gmail API fails, fall back to console logging
      console.log('=== EMAIL NOTIFICATION (Gmail failed, using console fallback) ===');
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

// Helper function to create email message in base64 format
function createEmailMessage(from: string, to: string[], subject: string, body: string): string {
  const emailLines = [
    `From: ${from}`,
    `To: ${to.join(', ')}`,
    `Subject: ${subject}`,
    'MIME-Version: 1.0',
    'Content-Type: text/html; charset=utf-8',
    'Content-Transfer-Encoding: 7bit',
    '',
    body.replace(/\n/g, '<br>'),
  ];

  const email = emailLines.join('\r\n');
  return Buffer.from(email).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
} 