#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔧 Google Service Account Key Formatter');
console.log('=====================================\n');

// Check if a file path was provided
const filePath = process.argv[2];

if (!filePath) {
  console.log('Usage: node format-service-account-key.js <path-to-service-account-key.json>');
  console.log('\nExample: node format-service-account-key.js ~/Downloads/service-account-key.json');
  console.log('\nThis script will format your service account key for use in the .env file.');
  process.exit(1);
}

try {
  // Read the JSON file
  const jsonContent = fs.readFileSync(filePath, 'utf8');
  
  // Parse to validate JSON
  const parsed = JSON.parse(jsonContent);
  
  // Validate required fields
  if (!parsed.client_email) {
    throw new Error('Missing client_email field');
  }
  if (!parsed.private_key) {
    throw new Error('Missing private_key field');
  }
  if (!parsed.project_id) {
    throw new Error('Missing project_id field');
  }
  
  // Format for .env file (single line with escaped quotes)
  const formattedKey = JSON.stringify(parsed).replace(/"/g, '\\"');
  
  console.log('✅ Service account key parsed successfully!');
  console.log('📧 Client email:', parsed.client_email);
  console.log('🏢 Project ID:', parsed.project_id);
  console.log('\n📋 Add this to your .env file:');
  console.log('=====================================');
  console.log(`GOOGLE_SERVICE_ACCOUNT_KEY="${formattedKey}"`);
  console.log('=====================================\n');
  
  console.log('💡 Don\'t forget to also add:');
  console.log('GOOGLE_SHEET_ID=your_sheet_id_here');
  console.log('\n📖 See GOOGLE_SHEETS_SETUP_GUIDE.md for complete setup instructions.');
  
} catch (error) {
  if (error.code === 'ENOENT') {
    console.error('❌ File not found:', filePath);
    console.log('💡 Make sure the file path is correct.');
  } else if (error instanceof SyntaxError) {
    console.error('❌ Invalid JSON file:', error.message);
    console.log('💡 Make sure the file contains valid JSON.');
  } else {
    console.error('❌ Error:', error.message);
  }
  process.exit(1);
}   