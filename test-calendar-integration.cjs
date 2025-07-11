#!/usr/bin/env node

require('dotenv').config();

const { google } = require('googleapis');

console.log('🧪 Testing Google Calendar Integration...\n');

// Check environment variables
console.log('📋 Environment Check:');
console.log('  GOOGLE_SERVICE_ACCOUNT_KEY:', process.env.GOOGLE_SERVICE_ACCOUNT_KEY ? 'Set' : 'NOT SET');
console.log('  GOOGLE_CALENDAR_ID:', process.env.GOOGLE_CALENDAR_ID ? 'Set' : 'NOT SET');

if (!process.env.GOOGLE_SERVICE_ACCOUNT_KEY || !process.env.GOOGLE_CALENDAR_ID) {
  console.log('\n❌ Missing required environment variables!');
  console.log('Please follow the setup guide in setup-google-calendar.md');
  process.exit(1);
}

// Test service account key parsing
let credentials;
try {
  credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY);
  console.log('  ✅ Service account key parsed successfully');
  console.log('  📧 Service account email:', credentials.client_email);
} catch (error) {
  console.log('  ❌ Failed to parse service account key:', error.message);
  process.exit(1);
}

// Initialize Google Calendar API
const auth = new google.auth.GoogleAuth({
  credentials,
  scopes: ['https://www.googleapis.com/auth/calendar'],
});

const calendar = google.calendar({ version: 'v3', auth });

async function testCalendarAccess() {
  try {
    console.log('\n🔍 Testing calendar access...');
    
    // Try to get calendar details
    const calendarResponse = await calendar.calendars.get({
      calendarId: process.env.GOOGLE_CALENDAR_ID,
    });
    
    console.log('  ✅ Calendar access successful');
    console.log('  📅 Calendar name:', calendarResponse.data.summary);
    console.log('  🆔 Calendar ID:', calendarResponse.data.id);
    
    return true;
  } catch (error) {
    console.log('  ❌ Calendar access failed:', error.message);
    if (error.message.includes('Not Found')) {
      console.log('  💡 Make sure the calendar ID is correct');
    } else if (error.message.includes('Forbidden')) {
      console.log('  💡 Make sure the service account has access to the calendar');
    }
    return false;
  }
}

async function testEventCreation() {
  try {
    console.log('\n📅 Testing event creation...');
    
    const testEvent = {
      summary: '🧪 Test Vacation Event - Stars Vacation Management',
      description: 'This is a test event to verify calendar integration is working properly.\n\nEmployee: Test User\nCompany: Stars MC\nType: Vacation',
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
    
    const response = await calendar.events.insert({
      calendarId: process.env.GOOGLE_CALENDAR_ID,
      requestBody: testEvent,
    });
    
    console.log('  ✅ Test event created successfully');
    console.log('  🆔 Event ID:', response.data.id);
    console.log('  🔗 Event URL:', response.data.htmlLink);
    
    // Clean up - delete the test event
    console.log('\n🧹 Cleaning up test event...');
    await calendar.events.delete({
      calendarId: process.env.GOOGLE_CALENDAR_ID,
      eventId: response.data.id,
    });
    console.log('  ✅ Test event deleted');
    
    return true;
  } catch (error) {
    console.log('  ❌ Event creation failed:', error.message);
    return false;
  }
}

async function runTests() {
  console.log('\n🚀 Running integration tests...\n');
  
  const calendarAccess = await testCalendarAccess();
  if (!calendarAccess) {
    console.log('\n❌ Calendar access test failed. Please check your configuration.');
    process.exit(1);
  }
  
  const eventCreation = await testEventCreation();
  if (!eventCreation) {
    console.log('\n❌ Event creation test failed. Please check your configuration.');
    process.exit(1);
  }
  
  console.log('\n🎉 All tests passed! Google Calendar integration is working properly.');
  console.log('\n✅ Your vacation management system will now automatically add approved requests to the calendar.');
  console.log('\n📋 Next steps:');
  console.log('  1. Restart your development server');
  console.log('  2. Approve a vacation request');
  console.log('  3. Check that the event appears in the Google Calendar');
}

runTests().catch(error => {
  console.error('\n❌ Test failed with error:', error);
  process.exit(1);
}); 