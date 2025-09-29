// Test SMTP connection with different configurations
// Run with: node test-smtp-connection.js

const nodemailer = require('nodemailer');

async function testSMTPConnection() {
  console.log('🧪 Testing SMTP connections...\n');

  const configs = [
    {
      name: 'Gmail Standard (Port 587)',
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      auth: {
        user: 'pierre@stars.mc',
        pass: 'yrdfkzobckgjlzwv'
      }
    },
    {
      name: 'Gmail SSL (Port 465)',
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: {
        user: 'pierre@stars.mc',
        pass: 'yrdfkzobckgjlzwv'
      }
    },
    {
      name: 'Gmail with STARTTLS (Port 587)',
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      requireTLS: true,
      auth: {
        user: 'pierre@stars.mc',
        pass: 'yrdfkzobckgjlzwv'
      }
    }
  ];

  for (const config of configs) {
    console.log(`📧 Testing: ${config.name}`);
    
    try {
      const transporter = nodemailer.createTransporter(config);
      
      // Test connection
      await transporter.verify();
      console.log(`✅ ${config.name}: Connection successful!`);
      
      // Try to send a test email
      const info = await transporter.sendMail({
        from: `"Stars Vacation Test" <${config.auth.user}>`,
        to: 'pierre@stars.mc',
        subject: 'SMTP Test - Stars Vacation Management',
        text: 'This is a test email to verify SMTP configuration.',
        html: '<h1>SMTP Test</h1><p>This is a test email to verify SMTP configuration.</p>'
      });
      
      console.log(`✅ ${config.name}: Test email sent successfully!`);
      console.log(`   Message ID: ${info.messageId}`);
      break; // Stop testing if one works
      
    } catch (error) {
      console.log(`❌ ${config.name}: ${error.message}`);
      
      if (error.code === 'EAUTH') {
        console.log(`   🔐 Authentication failed - check username/password`);
      } else if (error.code === 'ECONNECTION') {
        console.log(`   🌐 Connection failed - check network/firewall`);
      } else if (error.code === 'ETIMEDOUT') {
        console.log(`   ⏰ Connection timeout - check network`);
      }
    }
    
    console.log(''); // Empty line for readability
  }
}

// Run the test
testSMTPConnection().catch(console.error);
