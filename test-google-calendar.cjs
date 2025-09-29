#!/usr/bin/env node

require('dotenv').config({ path: '.env.local' });
const { google } = require('googleapis');

console.log('🧪 Testing Google Calendar Integration\n');

// Check environment variables
if (!process.env.GOOGLE_SERVICE_ACCOUNT_KEY || !process.env.GOOGLE_CALENDAR_TARGET_ID) {
  console.log('❌ Missing required environment variables!');
  console.log('Please set GOOGLE_SERVICE_ACCOUNT_KEY and GOOGLE_CALENDAR_TARGET_ID');
  process.exit(1);
}

// Utility function to load and parse Google credentials
function loadGoogleCreds() {
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
  if (!raw) throw new Error("GOOGLE_SERVICE_ACCOUNT_KEY manquante");

  // 1) Si c'est du JSON (cas recommandé en .env)
  if (raw.trim().startsWith("{")) {
    const obj = JSON.parse(raw);
    if (!obj.client_email || !obj.private_key) {
      throw new Error("Clé de service Google invalide (champs manquants)");
    }
    // Remettre de vrais retours à la ligne
    obj.private_key = String(obj.private_key).replace(/\\n/g, "\n");
    return { client_email: obj.client_email, private_key: obj.private_key };
  }

  // 2) Si quelqu'un a mis directement le PEM dans la variable
  const pem = raw.includes("\\n") ? raw.replace(/\\n/g, "\n") : raw;
  return { client_email: process.env.GOOGLE_CLIENT_EMAIL, private_key: pem };
}

// Initialize Google Calendar API
const auth = new google.auth.GoogleAuth({
  credentials: (() => {
    try {
      const creds = loadGoogleCreds();
      console.log('🔍 Loaded credentials:');
      console.log('  - Client email:', creds.client_email);
      console.log('  - Private key length:', creds.private_key.length);
      console.log('  - Private key starts with:', creds.private_key.substring(0, 50));
      console.log('  - Private key ends with:', creds.private_key.substring(creds.private_key.length - 50));
      return creds;
    } catch (error) {
      console.error('❌ Error loading Google credentials:', error);
      return {};
    }
  })(),
  scopes: ['https://www.googleapis.com/auth/calendar'],
});

const calendar = google.calendar({ version: 'v3', auth });

async function testCalendarAccess() {
  try {
    console.log('🔍 Testing calendar access...');
    
    // Test 1: List calendars to verify authentication
    const calendarsResponse = await calendar.calendarList.list();
    console.log('✅ Successfully authenticated with Google Calendar API');
    console.log(`📅 Found ${calendarsResponse.data.items?.length || 0} accessible calendars`);
    
    // Test 2: Try to access the specific calendar
    const calendarId = process.env.GOOGLE_CALENDAR_TARGET_ID || 'primary';
    console.log(`🔍 Testing access to calendar: ${calendarId}`);
    
    const calendarResponse = await calendar.calendars.get({
      calendarId: calendarId
    });
    
    console.log('✅ Successfully accessed the target calendar');
    console.log(`📅 Calendar name: ${calendarResponse.data.summary}`);
    console.log(`📅 Calendar description: ${calendarResponse.data.description || 'No description'}`);
    
    // Test 3: Try to add a test event
    console.log('\n🧪 Testing event creation...');
    
    const testEvent = {
      summary: '🧪 Test Event - Stars Vacation Management',
      description: 'This is a test event to verify Google Calendar integration is working.',
      start: {
        date: new Date().toISOString().split('T')[0], // Today
        timeZone: 'UTC',
      },
      end: {
        date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Tomorrow
        timeZone: 'UTC',
      },
      colorId: '1', // Blue
      transparency: 'transparent',
    };
    
    const insertResponse = await calendar.events.insert({
      calendarId: calendarId,
      requestBody: testEvent,
    });
    
    console.log('✅ Successfully created test event');
    console.log(`📅 Event ID: ${insertResponse.data.id}`);
    console.log(`📅 Event URL: ${insertResponse.data.htmlLink}`);
    
    // Test 4: Delete the test event
    console.log('\n🧹 Cleaning up test event...');
    await calendar.events.delete({
      calendarId: calendarId,
      eventId: insertResponse.data.id,
    });
    
    console.log('✅ Successfully deleted test event');
    
    console.log('\n🎉 All tests passed! Google Calendar integration is working correctly.');
    console.log('✅ Authentication: Working');
    console.log('✅ Calendar Access: Working');
    console.log('✅ Event Creation: Working');
    console.log('✅ Event Deletion: Working');
    
    console.log('\n💡 If approved vacation requests still don\'t appear:');
    console.log('1. Check the Vercel deployment logs for errors');
    console.log('2. Verify the approval process is calling the calendar API');
    console.log('3. Check that the service account has the correct permissions');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    
    if (error.code === 403) {
      console.log('\n💡 Permission denied. Check that:');
      console.log('1. The service account has access to the calendar');
      console.log('2. The calendar ID is correct');
      console.log('3. The service account has "Make changes to events" permission');
    } else if (error.code === 404) {
      console.log('\n💡 Calendar not found. Check that:');
      console.log('1. The calendar ID is correct');
      console.log('2. The calendar exists and is accessible');
    } else {
      console.log('\n💡 Unknown error. Check the error details above.');
    }
    
    process.exit(1);
  }
}

testCalendarAccess(); 