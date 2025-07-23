#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔧 Fix Email Notifications Issue');
console.log('================================\n');

// Check if .env file exists
const envPath = path.join(process.cwd(), '.env');
if (!fs.existsSync(envPath)) {
  console.log('❌ .env file not found!');
  console.log('Please create a .env file with your email configuration.');
  process.exit(1);
}

// Read current .env file
const envContent = fs.readFileSync(envPath, 'utf8');
const lines = envContent.split('\n');

console.log('📧 Current Email Configuration:');
console.log('================================');

// Find and display current email settings
const emailSettings = {
  SMTP_HOST: '',
  SMTP_PORT: '',
  SMTP_USER: '',
  SMTP_FROM: '',
  SMTP_PASSWORD: '',
  RESEND_API_KEY: ''
};

lines.forEach(line => {
  const [key, value] = line.split('=');
  if (emailSettings.hasOwnProperty(key)) {
    emailSettings[key] = value || '';
    if (key === 'SMTP_PASSWORD') {
      console.log(`${key}: ${value ? 'Set (' + value.substring(0, 4) + '...)' : 'NOT SET'}`);
    } else {
      console.log(`${key}: ${value || 'NOT SET'}`);
    }
  }
});

console.log('\n🔍 Issue Analysis:');
console.log('==================');

if (emailSettings.SMTP_PASSWORD) {
  console.log('❌ Gmail app password is set but authentication is failing');
  console.log('💡 This means the password is invalid or has expired');
} else {
  console.log('❌ Gmail app password is not set');
}

console.log('\n🛠️  Solution Steps:');
console.log('==================');
console.log('1. Generate a new Gmail app password:');
console.log('   - Go to https://myaccount.google.com/');
console.log('   - Security > 2-Step Verification > App passwords');
console.log('   - Generate new password for "Mail"');
console.log('');
console.log('2. Update the .env file with the new password:');
console.log('   SMTP_PASSWORD=your_new_16_character_password');
console.log('');
console.log('3. Test the email service:');
console.log('   node test-gmail-smtp.cjs');
console.log('');
console.log('4. Restart the development server:');
console.log('   npm run dev');

console.log('\n📋 Alternative Solutions:');
console.log('========================');
console.log('Option 1: Use Resend (Recommended)');
console.log('- Sign up at https://resend.com');
console.log('- Add RESEND_API_KEY=your_key to .env');
console.log('');
console.log('Option 2: Use different SMTP server');
console.log('- Update SMTP_HOST, SMTP_USER, SMTP_PASSWORD in .env');

console.log('\n🔗 For detailed instructions, see: FIX_EMAIL_NOTIFICATIONS.md');

// Offer to help update the password if provided as argument
if (process.argv[2]) {
  const newPassword = process.argv[2];
  console.log('\n🔄 Updating SMTP_PASSWORD...');
  
  const updatedLines = lines.map(line => {
    if (line.startsWith('SMTP_PASSWORD=')) {
      return `SMTP_PASSWORD=${newPassword}`;
    }
    return line;
  });
  
  fs.writeFileSync(envPath, updatedLines.join('\n'));
  console.log('✅ SMTP_PASSWORD updated successfully!');
  console.log('🔄 Please restart your development server.');
} 