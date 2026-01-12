#!/usr/bin/env node

/**
 * Test script to check communication with Google Calendar
 * Calendar ID: c_1ee147e8254f6b2d5985d9ce6c4f9b39983d00cdcfe3c3732fa3aa33a1e30e0e@group.calendar.google.com
 */

const { google } = require('googleapis');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '.env.local') });

const TARGET_CALENDAR_ID = 'c_1ee147e8254f6b2d5985d9ce6c4f9b39983d00cdcfe3c3732fa3aa33a1e30e0e@group.calendar.google.com';

function loadGoogleCreds() {
  // Try base64 encoded key first
  const base64Key = process.env.GOOGLE_CALENDAR_SERVICE_ACCOUNT_KEY_BASE64;
  if (base64Key) {
    try {
      const decoded = Buffer.from(base64Key, 'base64').toString('utf-8');
      const obj = JSON.parse(decoded);
      if (!obj.client_email || !obj.private_key) {
        throw new Error("Base64 Google Calendar service account key invalid (missing fields)");
      }
      obj.private_key = String(obj.private_key).replace(/\\n/g, "\n");
      return { client_email: obj.client_email, private_key: obj.private_key };
    } catch (error) {
      console.error('❌ Error decoding base64 key:', error);
    }
  }

  // Fallback to regular key
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
  if (!raw) {
    throw new Error("No Google service account key found. Set GOOGLE_CALENDAR_SERVICE_ACCOUNT_KEY_BASE64 or GOOGLE_SERVICE_ACCOUNT_KEY");
  }

  if (raw.trim().startsWith("{")) {
    const obj = JSON.parse(raw);
    if (!obj.client_email || !obj.private_key) {
      throw new Error("Google service account key invalid (missing fields)");
    }
    obj.private_key = String(obj.private_key).replace(/\\n/g, "\n");
    return { client_email: obj.client_email, private_key: obj.private_key };
  }

  const pem = raw.includes("\\n") ? raw.replace(/\\n/g, "\n") : raw;
  return { client_email: process.env.GOOGLE_CLIENT_EMAIL, private_key: pem };
}

async function testCalendarCommunication() {
  console.log('🔍 Testing Google Calendar Communication\n');
  console.log('📅 Calendar ID:', TARGET_CALENDAR_ID);
  console.log('─'.repeat(80));

  try {
    // Load credentials
    console.log('\n1️⃣ Loading Google Calendar credentials...');
    const credentials = loadGoogleCreds();
    console.log('✅ Credentials loaded');
    console.log('   Service Account:', credentials.client_email);
    console.log('─'.repeat(80));

    // Initialize auth
    console.log('\n2️⃣ Initializing Google Calendar API client...');
    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/calendar.readonly'],
    });

    const calendar = google.calendar({ version: 'v3', auth });
    console.log('✅ Calendar client initialized');
    console.log('─'.repeat(80));

    // Test 1: Get calendar metadata
    console.log('\n3️⃣ Testing: Get Calendar Metadata...');
    try {
      const calendarInfo = await calendar.calendars.get({
        calendarId: TARGET_CALENDAR_ID,
      });
      console.log('✅ Calendar metadata retrieved successfully');
      console.log('   Summary:', calendarInfo.data.summary || 'N/A');
      console.log('   Description:', calendarInfo.data.description || 'N/A');
      console.log('   Timezone:', calendarInfo.data.timeZone || 'N/A');
      console.log('   Access Role:', calendarInfo.data.accessRole || 'N/A');
      console.log('   Location:', calendarInfo.data.location || 'N/A');
    } catch (error) {
      console.error('❌ Failed to get calendar metadata:', error.message);
      if (error.code === 404) {
        console.error('   → Calendar not found. Check if the calendar ID is correct.');
      } else if (error.code === 403) {
        console.error('   → Permission denied. Service account needs "See all event details" permission.');
      }
      throw error;
    }
    console.log('─'.repeat(80));

    // Test 2: List events (last 30 days and next 30 days)
    console.log('\n4️⃣ Testing: List Events (Last 30 days + Next 30 days)...');
    const now = new Date();
    const timeMin = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const timeMax = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();
    
    console.log('   Time Range:', timeMin, 'to', timeMax);
    
    try {
      const eventsResponse = await calendar.events.list({
        calendarId: TARGET_CALENDAR_ID,
        timeMin: timeMin,
        timeMax: timeMax,
        singleEvents: true,
        orderBy: 'startTime',
        maxResults: 50,
      });

      const events = eventsResponse.data.items || [];
      console.log(`✅ Successfully retrieved ${events.length} events`);
      
      if (events.length > 0) {
        console.log('\n   Recent Events:');
        events.slice(0, 10).forEach((event, index) => {
          const start = event.start?.date || event.start?.dateTime || 'N/A';
          const summary = event.summary || 'No title';
          console.log(`   ${index + 1}. ${summary} (${start})`);
        });
        if (events.length > 10) {
          console.log(`   ... and ${events.length - 10} more events`);
        }
      } else {
        console.log('   ℹ️  No events found in this time range');
      }
    } catch (error) {
      console.error('❌ Failed to list events:', error.message);
      if (error.code === 403) {
        console.error('   → Permission denied. Service account needs "See all event details" permission.');
      }
      throw error;
    }
    console.log('─'.repeat(80));

    // Test 3: List events (wider range - 3 months back, 9 months forward)
    console.log('\n5️⃣ Testing: List Events (Wider Range - 3 months back, 9 months forward)...');
    const startDate = new Date(now.getFullYear(), now.getMonth() - 3, 1);
    const endDate = new Date(now.getFullYear(), now.getMonth() + 9, 0);
    const timeMinWide = startDate.toISOString();
    const timeMaxWide = endDate.toISOString();
    
    console.log('   Time Range:', timeMinWide, 'to', timeMaxWide);
    
    try {
      const eventsResponseWide = await calendar.events.list({
        calendarId: TARGET_CALENDAR_ID,
        timeMin: timeMinWide,
        timeMax: timeMaxWide,
        singleEvents: true,
        orderBy: 'startTime',
        maxResults: 100,
      });

      const eventsWide = eventsResponseWide.data.items || [];
      console.log(`✅ Successfully retrieved ${eventsWide.length} events in wider range`);
      
      // Group by month
      const eventsByMonth = {};
      eventsWide.forEach(event => {
        const start = event.start?.date || event.start?.dateTime || '';
        if (start) {
          const month = start.substring(0, 7); // YYYY-MM
          if (!eventsByMonth[month]) {
            eventsByMonth[month] = 0;
          }
          eventsByMonth[month]++;
        }
      });
      
      if (Object.keys(eventsByMonth).length > 0) {
        console.log('\n   Events by Month:');
        Object.entries(eventsByMonth)
          .sort()
          .forEach(([month, count]) => {
            console.log(`   ${month}: ${count} events`);
          });
      }
    } catch (error) {
      console.error('❌ Failed to list events (wide range):', error.message);
      throw error;
    }
    console.log('─'.repeat(80));

    // Summary
    console.log('\n✅ All tests passed!');
    console.log('\n📊 Summary:');
    console.log('   ✅ Calendar access: Working');
    console.log('   ✅ Event listing: Working');
    console.log('   ✅ Service account:', credentials.client_email);
    console.log('   ✅ Calendar ID:', TARGET_CALENDAR_ID);
    console.log('\n💡 The calendar communication is functioning correctly.');
    console.log('   This calendar is used as a SOURCE calendar to READ events from.');

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error('\n🔧 Troubleshooting:');
    console.error('   1. Verify the service account has access to the calendar');
    console.error('   2. Check that the calendar ID is correct');
    console.error('   3. Ensure GOOGLE_CALENDAR_SERVICE_ACCOUNT_KEY_BASE64 or GOOGLE_SERVICE_ACCOUNT_KEY is set');
    console.error('   4. Verify the service account has "See all event details" permission');
    console.error('\n📝 Error details:');
    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Status Text:', error.response.statusText);
      console.error('   Data:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.error('   Error:', error);
    }
    process.exit(1);
  }
}

// Run the test
testCalendarCommunication().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
