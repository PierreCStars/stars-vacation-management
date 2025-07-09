#!/usr/bin/env node

/**
 * Migration Script: Google Sheets to Firebase
 * 
 * This script migrates existing vacation request data from Google Sheets to Firebase Firestore.
 * Run this script after setting up Firebase and before switching to the new system.
 */

const { initializeApp } = require('firebase/app');
const { getFirestore, collection, addDoc, serverTimestamp } = require('firebase/firestore');
const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: '.env' });

// Firebase configuration
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Google Sheets configuration
const SCOPES = ['https://www.googleapis.com/auth/spreadsheets.readonly'];
const SHEET_ID = process.env.GOOGLE_SHEET_ID;
const SHEET_NAME = process.env.GOOGLE_SHEET_NAME || 'Vacation Requests';

async function getGoogleSheetsData() {
  try {
    console.log('🔧 Initializing Google Sheets API...');
    
    // Load service account key
    const serviceAccountKeyPath = process.env.GOOGLE_SERVICE_ACCOUNT_KEY_PATH || 'holiday-461710-60be8a55bcb8.json';
    const serviceAccountKey = JSON.parse(fs.readFileSync(serviceAccountKeyPath, 'utf8'));
    
    console.log('✅ Service account key loaded successfully');
    console.log('📧 Client email:', serviceAccountKey.client_email);
    
    // Create JWT client
    const auth = new google.auth.JWT(
      serviceAccountKey.client_email,
      null,
      serviceAccountKey.private_key,
      SCOPES
    );
    
    // Authorize
    await auth.authorize();
    console.log('✅ Google Sheets API authorized successfully');
    
    // Create sheets API client
    const sheets = google.sheets({ version: 'v4', auth });
    
    // Read data from sheet
    console.log(`📊 Reading data from sheet: ${SHEET_NAME}`);
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: `'${SHEET_NAME}'!A:Z`, // Read all columns - use quotes for sheet names with spaces
    });
    
    const rows = response.data.values;
    if (!rows || rows.length === 0) {
      console.log('❌ No data found in Google Sheets');
      return [];
    }
    
    // Parse headers and data
    const headers = rows[0];
    const dataRows = rows.slice(1);
    
    console.log(`✅ Found ${dataRows.length} rows of data in Google Sheets`);
    console.log('📋 Headers:', headers);
    
    return dataRows.map((row, index) => {
      const obj = {};
      headers.forEach((header, i) => {
        obj[header] = row[i] || '';
      });
      obj._originalIndex = index + 2; // +2 because we skipped header and arrays are 0-indexed
      return obj;
    });
    
  } catch (error) {
    console.error('❌ Error reading Google Sheets data:', error);
    throw error;
  }
}

function transformDataForFirebase(sheetsData) {
  console.log('🔄 Transforming data for Firebase...');
  
  return sheetsData.map((row, index) => {
    // Map Google Sheets columns to Firebase fields
    const firebaseDoc = {
      userId: row['User ID'] || row['Email'] || row['User Email'] || '',
      userName: row['User Name'] || row['Name'] || row['Employee'] || '',
      startDate: row['Start Date'] || row['Start'] || '',
      endDate: row['End Date'] || row['End'] || '',
      reason: row['Reason'] || row['Comment'] || row['Description'] || '',
      company: row['Company'] || 'STARS',
      type: row['Type'] || row['Vacation Type'] || 'PAID_VACATION',
      status: row['Status'] || 'PENDING',
      createdAt: row['Created At'] || row['Date'] || row['Timestamp'] || new Date().toISOString(),
      reviewedBy: row['Reviewed By'] || row['Reviewer'] || '',
      reviewerEmail: row['Reviewer Email'] || '',
      reviewedAt: row['Reviewed At'] || row['Review Date'] || '',
      adminComment: row['Admin Comment'] || row['Review Comment'] || row['Comment'] || '',
    };
    
    // Clean up the data
    Object.keys(firebaseDoc).forEach(key => {
      if (firebaseDoc[key] === '') {
        delete firebaseDoc[key];
      }
    });
    
    // Convert date strings to proper format if needed
    if (firebaseDoc.startDate && !firebaseDoc.startDate.includes('T')) {
      firebaseDoc.startDate = new Date(firebaseDoc.startDate).toISOString();
    }
    if (firebaseDoc.endDate && !firebaseDoc.endDate.includes('T')) {
      firebaseDoc.endDate = new Date(firebaseDoc.endDate).toISOString();
    }
    
    console.log(`📝 Row ${index + 1}: ${firebaseDoc.userName} - ${firebaseDoc.status}`);
    
    return firebaseDoc;
  });
}

async function migrateToFirebase(transformedData) {
  console.log('🚀 Starting migration to Firebase...');
  
  const collectionRef = collection(db, 'vacationRequests');
  let successCount = 0;
  let errorCount = 0;
  
  for (let i = 0; i < transformedData.length; i++) {
    const doc = transformedData[i];
    
    try {
      // Add timestamp if not present
      if (!doc.createdAt) {
        doc.createdAt = serverTimestamp();
      }
      
      await addDoc(collectionRef, doc);
      successCount++;
      console.log(`✅ Migrated ${i + 1}/${transformedData.length}: ${doc.userName}`);
      
      // Add a small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
      
    } catch (error) {
      errorCount++;
      console.error(`❌ Error migrating row ${i + 1}:`, error);
    }
  }
  
  console.log('\n📊 Migration Summary:');
  console.log(`✅ Successfully migrated: ${successCount} records`);
  console.log(`❌ Failed to migrate: ${errorCount} records`);
  console.log(`📈 Success rate: ${((successCount / transformedData.length) * 100).toFixed(1)}%`);
  
  return { successCount, errorCount };
}

async function main() {
  try {
    console.log('🔄 Starting Google Sheets to Firebase migration...\n');
    
    // Validate environment variables
    const requiredEnvVars = [
      'NEXT_PUBLIC_FIREBASE_API_KEY',
      'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
      'GOOGLE_SHEET_ID'
    ];
    
    const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
    if (missingVars.length > 0) {
      console.error('❌ Missing required environment variables:', missingVars);
      console.error('Please check your .env.local file');
      process.exit(1);
    }
    
    // Step 1: Get data from Google Sheets
    const sheetsData = await getGoogleSheetsData();
    
    if (sheetsData.length === 0) {
      console.log('❌ No data to migrate');
      process.exit(0);
    }
    
    // Step 2: Transform data for Firebase
    const transformedData = transformDataForFirebase(sheetsData);
    
    // Step 3: Confirm migration
    console.log(`\n📋 Ready to migrate ${transformedData.length} records to Firebase`);
    console.log('⚠️  This will add new records to your Firebase database');
    
    // In a real scenario, you might want to add a confirmation prompt here
    // For now, we'll proceed automatically
    
    // Step 4: Migrate to Firebase
    const result = await migrateToFirebase(transformedData);
    
    if (result.errorCount === 0) {
      console.log('\n🎉 Migration completed successfully!');
      console.log('Your vacation management system is now ready to use Firebase.');
    } else {
      console.log('\n⚠️  Migration completed with some errors.');
      console.log('Please check the logs above for details.');
    }
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run the migration
if (require.main === module) {
  main();
}

module.exports = { main, getGoogleSheetsData, transformDataForFirebase, migrateToFirebase }; 