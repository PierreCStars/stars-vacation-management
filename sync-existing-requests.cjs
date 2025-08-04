#!/usr/bin/env node

require('dotenv').config();

const { google } = require('googleapis');

console.log('🔄 Syncing existing approved vacation requests to Google Calendar...\n');

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

// Helper functions from the main application
function getCompanyDisplayName(company) {
  const companyDisplayNames = {
    'STARS_MC': 'Stars MC',
    'STARS_YACHTING': 'Stars Yachting',
    'STARS_REAL_ESTATE': 'Stars Real Estate',
    'LE_PNEU': 'Le Pneu',
    'MIDI_PNEU': 'Midi Pneu',
    'STARS_AVIATION': 'Stars Aviation',
  };
  return companyDisplayNames[company] || company;
}

function getColorIdForCompany(company) {
  const companyColors = {
    'STARS_MC': '1',
    'STARS_YACHTING': '2',
    'STARS_REAL_ESTATE': '3',
    'LE_PNEU': '4',
    'MIDI_PNEU': '5',
    'STARS_AVIATION': '6',
  };
  return companyColors[company] || '1';
}

async function addVacationToCalendar(vacationEvent) {
  try {
    const startDate = new Date(vacationEvent.startDate);
    const endDate = new Date(vacationEvent.endDate);
    
    // Add one day to end date since Google Calendar events are exclusive
    endDate.setDate(endDate.getDate() + 1);
    
    const companyDisplayName = getCompanyDisplayName(vacationEvent.company);
    
    const event = {
      summary: `${vacationEvent.userName} - ${companyDisplayName}`,
      description: `Name: ${vacationEvent.userName}\nCompany: ${companyDisplayName}\nDate Range: ${startDate.toLocaleDateString()} - ${new Date(vacationEvent.endDate).toLocaleDateString()}\nType: ${vacationEvent.type}\nReason: ${vacationEvent.reason || 'N/A'}`,
      start: {
        date: startDate.toISOString().split('T')[0],
        timeZone: 'UTC',
      },
      end: {
        date: endDate.toISOString().split('T')[0],
        timeZone: 'UTC',
      },
      colorId: getColorIdForCompany(vacationEvent.company),
      transparency: 'transparent',
    };

    const response = await calendar.events.insert({
      calendarId: process.env.GOOGLE_CALENDAR_ID,
      requestBody: event,
    });

    console.log(`  ✅ Added: ${vacationEvent.userName} (${startDate.toLocaleDateString()} - ${new Date(vacationEvent.endDate).toLocaleDateString()})`);
    return response.data.id;
    
  } catch (error) {
    console.log(`  ❌ Failed to add ${vacationEvent.userName}: ${error.message}`);
    return null;
  }
}

async function syncExistingRequests() {
  try {
    // Fetch vacation requests from the API
    console.log('📋 Fetching vacation requests...');
    const response = await fetch('http://localhost:3001/api/vacation-requests');
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const requests = await response.json();
    console.log(`📊 Found ${requests.length} total vacation requests`);
    
    // Filter for approved requests without calendar event IDs
    const approvedRequests = requests.filter(req => 
      req.status === 'APPROVED' && !req.googleCalendarEventId
    );
    
    console.log(`📅 Found ${approvedRequests.length} approved requests without calendar events`);
    
    if (approvedRequests.length === 0) {
      console.log('✅ All approved requests are already synced to the calendar!');
      return;
    }
    
    console.log('\n🔄 Syncing approved requests to Google Calendar...\n');
    
    let successCount = 0;
    let failureCount = 0;
    
    for (const request of approvedRequests) {
      const eventId = await addVacationToCalendar({
        userName: request.userName,
        startDate: request.startDate,
        endDate: request.endDate,
        type: request.type,
        company: request.company,
        reason: request.reason,
      });
      
      if (eventId) {
        successCount++;
        
        // Update the request with the calendar event ID
        try {
          const updateResponse = await fetch(`http://localhost:3001/api/vacation-requests/${request.id}`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              googleCalendarEventId: eventId,
            }),
          });
          
          if (!updateResponse.ok) {
            console.log(`  ⚠️  Warning: Could not update request ${request.id} with calendar event ID`);
          }
        } catch (error) {
          console.log(`  ⚠️  Warning: Could not update request ${request.id}: ${error.message}`);
        }
      } else {
        failureCount++;
      }
    }
    
    console.log('\n📊 Sync Summary:');
    console.log(`  ✅ Successfully synced: ${successCount} requests`);
    console.log(`  ❌ Failed to sync: ${failureCount} requests`);
    
    if (successCount > 0) {
      console.log('\n🎉 Successfully synced existing approved requests to Google Calendar!');
      console.log('📅 Check your Google Calendar to see the new events.');
    }
    
  } catch (error) {
    console.error('❌ Error syncing requests:', error.message);
    console.log('\n💡 Make sure your development server is running on port 3000');
  }
}

// Check if development server is running
async function checkServer() {
  try {
    const response = await fetch('http://localhost:3000/api/vacation-requests');
    return response.ok;
  } catch (error) {
    return false;
  }
}

async function main() {
  console.log('🔍 Checking if development server is running...');
  
  const serverRunning = await checkServer();
  if (!serverRunning) {
    console.log('❌ Development server is not running!');
    console.log('Please start your development server with: npm run dev');
    process.exit(1);
  }
  
  console.log('✅ Development server is running\n');
  
  await syncExistingRequests();
}

main().catch(error => {
  console.error('\n❌ Script failed:', error);
  process.exit(1);
}); 