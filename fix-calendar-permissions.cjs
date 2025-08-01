#!/usr/bin/env node

require('dotenv').config();
const { google } = require('googleapis');

console.log('🔧 Fix Google Calendar Permissions');
console.log('==================================\n');

// Check environment variables
if (!process.env.GOOGLE_SERVICE_ACCOUNT_KEY || !process.env.GOOGLE_CALENDAR_ID) {
  console.log('❌ Missing Google Calendar environment variables!');
  console.log('Please set up Google Calendar integration first.');
  process.exit(1);
}

// Initialize Google Calendar API
const auth = new google.auth.GoogleAuth({
  credentials: JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY),
  scopes: ['https://www.googleapis.com/auth/calendar'],
});

const calendar = google.calendar({ version: 'v3', auth });

async function testCalendarPermissions() {
  try {
    console.log('🔍 Testing Google Calendar Integration...\n');

    // Test 1: Check if we can read the calendar
    console.log('📋 Test 1: Reading calendar...');
    const calendarResponse = await calendar.calendars.get({
      calendarId: process.env.GOOGLE_CALENDAR_ID,
    });
    console.log('✅ Successfully accessed calendar:', calendarResponse.data.summary);
    console.log('📅 Calendar ID:', process.env.GOOGLE_CALENDAR_ID);
    console.log('📝 Description:', calendarResponse.data.description || 'No description');

    // Test 2: Try to create a test event
    console.log('\n📋 Test 2: Creating test event...');
    const testEvent = {
      summary: '🧪 Test Event - Stars Vacation Management',
      description: 'This is a test event to verify calendar permissions.',
      start: {
        date: new Date().toISOString().split('T')[0],
        timeZone: 'UTC',
      },
      end: {
        date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        timeZone: 'UTC',
      },
    };

    const createResponse = await calendar.events.insert({
      calendarId: process.env.GOOGLE_CALENDAR_ID,
      requestBody: testEvent,
    });

    console.log('✅ Successfully created test event:', createResponse.data.id);

    // Test 3: Delete the test event
    console.log('\n📋 Test 3: Deleting test event...');
    await calendar.events.delete({
      calendarId: process.env.GOOGLE_CALENDAR_ID,
      eventId: createResponse.data.id,
    });

    console.log('✅ Successfully deleted test event');

    console.log('\n🎉 Google Calendar integration is working correctly!');
    console.log('✅ Approved vacation requests will now appear in the calendar.');

  } catch (error) {
    console.error('\n❌ Calendar integration test failed:', error.message);
    
    if (error.message.includes('writer access') || error.message.includes('permission')) {
      console.log('\n🔧 SOLUTION: Grant Service Account Calendar Permissions');
      console.log('========================================================');
      console.log('');
      console.log('1. Go to Google Calendar: https://calendar.google.com/');
      console.log('2. Find the calendar: "Holidays"');
      console.log('3. Click the three dots → "Settings and sharing"');
      console.log('4. Scroll to "Share with specific people"');
      console.log('5. Click "Add people"');
      console.log('6. Add this email:');
      console.log('   vacation-db@holiday-461710.iam.gserviceaccount.com');
      console.log('7. Set permission to: "Make changes to events"');
      console.log('8. Click "Send"');
      console.log('');
      console.log('After granting permissions, run this script again to test.');
    } else {
      console.log('\n💡 Other possible issues:');
      console.log('- Check if the calendar ID is correct');
      console.log('- Verify the service account has proper credentials');
      console.log('- Check Google Cloud Console for API quotas');
    }
  }
}

testCalendarPermissions(); 