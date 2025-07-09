const fs = require('fs');

// Instructions for the user:
console.log('=== Gmail Configuration Fix ===');
console.log('');
console.log('1. Download your new service account key from Google Cloud Console');
console.log('2. Place the JSON file in this directory');
console.log('3. Update the filename below to match your downloaded file');
console.log('4. Run this script: node fix-gmail-config.js');
console.log('');

// Update this filename to match your downloaded service account key
const keyFileName = 'service-account-key.json'; // Change this to your actual filename

try {
  if (fs.existsSync(keyFileName)) {
    const keyData = JSON.parse(fs.readFileSync(keyFileName, 'utf8'));
    
    // Validate the key structure
    if (!keyData.client_email || !keyData.private_key) {
      console.error('❌ Invalid service account key: missing client_email or private_key');
      process.exit(1);
    }
    
    // Convert to single-line JSON string for environment variable
    const jsonString = JSON.stringify(keyData);
    
    console.log('✅ Service account key is valid!');
    console.log('');
    console.log('📧 Client Email:', keyData.client_email);
    console.log('');
    console.log('🔑 Add this to your .env file:');
    console.log('');
    console.log('GOOGLE_SERVICE_ACCOUNT_KEY=' + JSON.stringify(jsonString));
    console.log('');
    console.log('📝 Note: The key is already properly escaped for the .env file');
    
  } else {
    console.log(`❌ File not found: ${keyFileName}`);
    console.log('');
    console.log('Please:');
    console.log('1. Download your service account key from Google Cloud Console');
    console.log('2. Place it in this directory');
    console.log('3. Update the filename in this script');
    console.log('4. Run this script again');
  }
} catch (error) {
  console.error('❌ Error processing service account key:', error.message);
  console.log('');
  console.log('Make sure the JSON file is valid and not corrupted.');
} 