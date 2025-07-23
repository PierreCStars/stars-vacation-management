#!/usr/bin/env node

require('dotenv').config();
const { google } = require('googleapis');

console.log('🧪 Testing Primary Calendar Access\n');

// Check environment variables
if (!process.env.GOOGLE_SERVICE_ACCOUNT_KEY) {
  console.log('❌ Missing GOOGLE_SERVICE_ACCOUNT_KEY!');
  process.exit(1);
}

// Initialize Google Calendar API
const auth = new google.auth.GoogleAuth({
  credentials: JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY),
  scopes: ['https://www.googleapis.com/auth/calendar'],
});

const calendar = google.calendar({ version: 'v3', auth });

async function testPrimaryCalendar() {
  try {
    console.log('🔍 Testing primary calendar access...');
    
    // Use primary calendar (usually the user's main calendar)
    const calendarId = 'primary';
    
    // Test 1: Try to access the primary calendar
    console.log(`🔍 Testing access to primary calendar...`);
    
    const calendarResponse = await calendar.calendars.get({
      calendarId: calendarId
    });
    
    console.log('✅ Successfully accessed the primary calendar');
    console.log(`📅 Calendar name: ${calendarResponse.data.summary}`);
    console.log(`📅 Calendar description: ${calendarResponse.data.description || 'No description'}`);
    
    // Test 2: Try to add a test event
    console.log('\n🧪 Testing event creation on primary calendar...');
    
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
    
    console.log('✅ Successfully created test event on primary calendar');
    console.log(`📅 Event ID: ${insertResponse.data.id}`);
    console.log(`📅 Event URL: ${insertResponse.data.htmlLink}`);
    
    // Test 3: Delete the test event
    console.log('\n🧹 Cleaning up test event...');
    await calendar.events.delete({
      calendarId: calendarId,
      eventId: insertResponse.data.id,
    });
    
    console.log('✅ Successfully deleted test event');
    
    console.log('\n🎉 Primary calendar test passed!');
    console.log('💡 You can use "primary" as the calendar ID instead of the shared calendar.');
    console.log('💡 Update your GOOGLE_CALENDAR_ID environment variable to "primary"');
    
  } catch (error) {
    console.error('❌ Primary calendar test failed:', error.message);
    
    if (error.code === 403) {
      console.log('\n💡 Permission denied on primary calendar too.');
      console.log('This means the service account needs to be added to your Google Workspace.');
    } else {
      console.log('\n💡 Unknown error. Check the error details above.');
    }
    
    process.exit(1);
  }
}

testPrimaryCalendar(); 