#!/usr/bin/env node

/**
 * Script to check a specific vacation request and verify its calendar sync status
 * Usage: node check-specific-vacation.cjs F0lw1VW9jtsyQQdD7Y10
 */

const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const { google } = require('googleapis');

const requestId = process.argv[2] || 'F0lw1VW9jtsyQQdD7Y10';

// Initialize Firebase Admin
function initFirebase() {
  try {
    // Try to load credentials from environment
    const serviceAccountKey = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
    const base64Key = process.env.GOOGLE_CALENDAR_SERVICE_ACCOUNT_KEY_BASE64;
    
    let credentials;
    
    if (base64Key) {
      const decoded = Buffer.from(base64Key, 'base64').toString('utf-8');
      credentials = JSON.parse(decoded);
    } else if (serviceAccountKey) {
      credentials = typeof serviceAccountKey === 'string' && serviceAccountKey.startsWith('{')
        ? JSON.parse(serviceAccountKey)
        : serviceAccountKey;
    } else {
      throw new Error('No Firebase credentials found in environment variables');
    }
    
    return initializeApp({
      credential: cert(credentials)
    });
  } catch (error) {
    console.error('❌ Failed to initialize Firebase:', error.message);
    process.exit(1);
  }
}

// Initialize Google Calendar
function initGoogleCalendar() {
  try {
    const serviceAccountKey = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
    const base64Key = process.env.GOOGLE_CALENDAR_SERVICE_ACCOUNT_KEY_BASE64;
    
    let credentials;
    
    if (base64Key) {
      const decoded = Buffer.from(base64Key, 'base64').toString('utf-8');
      credentials = JSON.parse(decoded);
      credentials.private_key = String(credentials.private_key).replace(/\\n/g, "\n");
    } else if (serviceAccountKey) {
      if (typeof serviceAccountKey === 'string' && serviceAccountKey.startsWith('{')) {
        credentials = JSON.parse(serviceAccountKey);
        credentials.private_key = String(credentials.private_key).replace(/\\n/g, "\n");
      } else {
        throw new Error('Invalid service account key format');
      }
    } else {
      throw new Error('No Google Calendar credentials found');
    }
    
    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/calendar']
    });
    
    return google.calendar({ version: 'v3', auth });
  } catch (error) {
    console.error('❌ Failed to initialize Google Calendar:', error.message);
    process.exit(1);
  }
}

const CAL_TARGET = process.env.GOOGLE_CALENDAR_TARGET_ID || 
                   process.env.GOOGLE_CALENDAR_ID || 
                   'c_e98f5350bf743174f87e1a786038cb9d103c306b7246c6200684f81c37a6a764@group.calendar.google.com';

async function checkVacationRequest() {
  console.log(`\n🔍 Checking vacation request: ${requestId}\n`);
  
  // Initialize services
  const app = initFirebase();
  const db = getFirestore(app);
  const calendar = initGoogleCalendar();
  
  try {
    // Get the vacation request
    const docRef = db.collection('vacationRequests').doc(requestId);
    const doc = await docRef.get();
    
    if (!doc.exists) {
      console.error(`❌ Vacation request ${requestId} not found in Firestore`);
      process.exit(1);
    }
    
    const data = doc.data();
    console.log('📋 Vacation Request Data:');
    console.log(JSON.stringify(data, null, 2));
    console.log('\n');
    
    // Check status
    const status = data.status || 'unknown';
    console.log(`📊 Status: ${status}`);
    
    // Normalize status
    const normalizedStatus = status.toLowerCase().trim();
    const isApproved = ['approved', 'approve', 'ok', 'accepted', 'validated'].includes(normalizedStatus);
    console.log(`✅ Is Approved/Validated: ${isApproved ? 'YES' : 'NO'}`);
    
    // Check for calendar event IDs
    const calendarEventId = data.calendarEventId;
    const googleCalendarEventId = data.googleCalendarEventId;
    const googleEventId = data.googleEventId;
    
    console.log('\n📅 Calendar Event IDs:');
    console.log(`  calendarEventId: ${calendarEventId || 'NOT SET'}`);
    console.log(`  googleCalendarEventId: ${googleCalendarEventId || 'NOT SET'}`);
    console.log(`  googleEventId: ${googleEventId || 'NOT SET'}`);
    
    const eventId = calendarEventId || googleCalendarEventId || googleEventId;
    
    if (!eventId) {
      console.log('\n❌ No calendar event ID found in Firestore');
      console.log('   This request needs to be synced to Google Calendar');
      
      // Check if it should be synced
      if (!isApproved) {
        console.log(`\n⚠️  Request status is "${status}" - it needs to be approved/validated first`);
      } else {
        console.log('\n✅ Request is approved/validated and ready to sync');
        console.log('   Run the sync to create the calendar event');
      }
      return;
    }
    
    console.log(`\n🔍 Checking if event exists in Google Calendar...`);
    console.log(`   Calendar ID: ${CAL_TARGET}`);
    console.log(`   Event ID: ${eventId}`);
    
    // Try to get the event from Google Calendar
    try {
      const event = await calendar.events.get({
        calendarId: CAL_TARGET,
        eventId: eventId
      });
      
      console.log('\n✅ Event found in Google Calendar!');
      console.log(`   Summary: ${event.data.summary}`);
      console.log(`   Start: ${event.data.start?.date || event.data.start?.dateTime}`);
      console.log(`   End: ${event.data.end?.date || event.data.end?.dateTime}`);
      console.log(`   Status: ${event.data.status}`);
      console.log(`   HTML Link: ${event.data.htmlLink}`);
      
    } catch (error) {
      if (error.code === 404) {
        console.log('\n❌ Event NOT found in Google Calendar');
        console.log('   The event ID exists in Firestore but the event was deleted or never created');
        console.log('   This is a sync issue - the event needs to be recreated');
        
        // Check if we can recreate it
        if (isApproved && data.startDate && data.endDate) {
          console.log('\n✅ Request has all required data - can be re-synced');
          console.log(`   User: ${data.userName || 'Unknown'}`);
          console.log(`   Dates: ${data.startDate} to ${data.endDate}`);
        } else {
          console.log('\n⚠️  Request is missing required data for sync');
          console.log(`   Has startDate: ${!!data.startDate}`);
          console.log(`   Has endDate: ${!!data.endDate}`);
        }
      } else {
        console.error('\n❌ Error checking Google Calendar:', error.message);
        console.error('   Code:', error.code);
        console.error('   This might be a permission issue');
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
    process.exit(1);
  }
}

checkVacationRequest().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});

