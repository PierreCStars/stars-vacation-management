#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔧 Quick Gmail Password Update');
console.log('==============================\n');

// Check if password provided as argument
if (process.argv.length < 3) {
  console.log('❌ Please provide the new Gmail app password as an argument');
  console.log('');
  console.log('Usage:');
  console.log('  node update-gmail-password.cjs YOUR_NEW_16_CHAR_PASSWORD');
  console.log('');
  console.log('Example:');
  console.log('  node update-gmail-password.cjs abcd1234efgh5678');
  console.log('');
  console.log('To get a new Gmail app password:');
  console.log('  1. Go to https://myaccount.google.com/apppasswords');
  console.log('  2. Select "Mail" and generate new password');
  console.log('  3. Copy the 16-character password');
  console.log('  4. Run this script with the new password');
  process.exit(1);
}

const newPassword = process.argv[2];

// Validate password format
if (newPassword.length !== 16) {
  console.log('❌ Password must be exactly 16 characters long');
  console.log(`   Current length: ${newPassword.length} characters`);
  process.exit(1);
}

// Check if .env file exists
const envPath = path.join(process.cwd(), '.env');
if (!fs.existsSync(envPath)) {
  console.log('❌ .env file not found!');
  process.exit(1);
}

// Read and update .env file
const envContent = fs.readFileSync(envPath, 'utf8');
const lines = envContent.split('\n');

let updated = false;
const updatedLines = lines.map(line => {
  if (line.startsWith('SMTP_PASSWORD=')) {
    updated = true;
    return `SMTP_PASSWORD=${newPassword}`;
  }
  return line;
});

if (!updated) {
  console.log('❌ SMTP_PASSWORD not found in .env file');
  process.exit(1);
}

// Write updated .env file
fs.writeFileSync(envPath, updatedLines.join('\n'));

console.log('✅ Gmail app password updated successfully!');
console.log('');
console.log('🔄 Next steps:');
console.log('  1. Restart your development server:');
console.log('     npm run dev');
console.log('');
console.log('  2. Test the email service:');
console.log('     curl -X GET http://localhost:3000/api/test-email');
console.log('');
console.log('  3. Submit a test vacation request to verify notifications work');
console.log('');
console.log('📧 compta@stars.mc should now receive:');
console.log('   - New vacation request notifications');
console.log('   - Request approval/rejection notifications');
console.log('   - Monthly CSV reports'); 