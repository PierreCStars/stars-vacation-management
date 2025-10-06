#!/usr/bin/env node

/**
 * Script to update all URLs to use the correct production URL
 * https://starsvacationmanagementv2.vercel.app
 */

const fs = require('fs');
const path = require('path');

const CORRECT_URL = 'https://starsvacationmanagementv2.vercel.app';
const OLD_URLS = [
  'http://localhost:3000',
  'https://stars-vacation-management.vercel.app',
  'https://your-vercel-url.vercel.app',
  'https://your-production-domain.com'
];

console.log('🔧 Updating URLs to use correct production URL...');
console.log('✅ Target URL:', CORRECT_URL);

// Update .env.local file
const envPath = path.join(__dirname, '.env.local');
if (fs.existsSync(envPath)) {
  console.log('\n📝 Updating .env.local...');
  let envContent = fs.readFileSync(envPath, 'utf8');
  
  // Update APP_BASE_URL
  envContent = envContent.replace(
    /APP_BASE_URL="[^"]*"/,
    `APP_BASE_URL="${CORRECT_URL}"`
  );
  
  // Update NEXTAUTH_URL
  envContent = envContent.replace(
    /NEXTAUTH_URL="[^"]*"/,
    `NEXTAUTH_URL="${CORRECT_URL}"`
  );
  
  // Update NEXT_PUBLIC_APP_URL
  envContent = envContent.replace(
    /NEXT_PUBLIC_APP_URL="[^"]*"/,
    `NEXT_PUBLIC_APP_URL="${CORRECT_URL}"`
  );
  
  fs.writeFileSync(envPath, envContent);
  console.log('✅ .env.local updated successfully');
} else {
  console.log('⚠️  .env.local not found');
}

// Check for hardcoded URLs in source files
console.log('\n🔍 Checking for hardcoded URLs in source files...');

const sourceDir = path.join(__dirname, 'src');
const filesToCheck = [];

function findFiles(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory() && !file.startsWith('.') && file !== 'node_modules') {
      findFiles(filePath);
    } else if (file.endsWith('.ts') || file.endsWith('.tsx') || file.endsWith('.js') || file.endsWith('.jsx')) {
      filesToCheck.push(filePath);
    }
  }
}

findFiles(sourceDir);

let foundIssues = false;

for (const filePath of filesToCheck) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    for (const oldUrl of OLD_URLS) {
      if (line.includes(oldUrl)) {
        console.log(`⚠️  Found old URL in ${filePath}:${i + 1}`);
        console.log(`   ${line.trim()}`);
        foundIssues = true;
      }
    }
  }
}

if (!foundIssues) {
  console.log('✅ No hardcoded old URLs found in source files');
}

console.log('\n🎉 URL update completed!');
console.log('\n📋 Next steps:');
console.log('1. Restart your development server');
console.log('2. Test email notifications to verify URLs are correct');
console.log('3. Deploy to production to ensure the changes take effect');
