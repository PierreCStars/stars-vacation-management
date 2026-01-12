#!/usr/bin/env node

/**
 * Force sync all approved vacation requests to Google Calendar
 * This script directly uses the sync logic without requiring the server to be running
 */

const { google } = require('googleapis');
const admin = require('firebase-admin');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env.local') });

// Initialize Firebase Admin
function initFirebase() {
  if (admin.apps.length > 0) {
    return admin.apps[0];
  }

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n');

  if (!projectId || !clientEmail || !privateKey) {
    // Try alternative: FIREBASE_SERVICE_ACCOUNT_KEY
    const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
    if (serviceAccount) {
      try {
        const creds = typeof serviceAccount === 'string' ? JSON.parse(serviceAccount) : serviceAccount;
        return admin.initializeApp({
          credential: admin.credential.cert(creds)
        });
      } catch (error) {
        throw new Error(`Failed to parse FIREBASE_SERVICE_ACCOUNT_KEY: ${error.message}`);
      }
    }
    throw new Error('Missing Firebase Admin environment variables (need FIREBASE_PROJECT_ID, FIREBASE_ADMIN_CLIENT_EMAIL, FIREBASE_ADMIN_PRIVATE_KEY, or FIREBASE_SERVICE_ACCOUNT_KEY)');
  }

  return admin.initializeApp({
    credential: admin.credential.cert({ projectId, clientEmail, privateKey }),
  });
}

initFirebase();

const db = admin.firestore();

// Load Google Calendar credentials
function loadGoogleCreds() {
  const base64Key = process.env.GOOGLE_CALENDAR_SERVICE_ACCOUNT_KEY_BASE64;
  if (base64Key) {
    try {
      const decoded = Buffer.from(base64Key, 'base64').toString('utf-8');
      const obj = JSON.parse(decoded);
      if (!obj.client_email || !obj.private_key) {
        throw new Error("Base64 Google Calendar service account key invalid");
      }
      obj.private_key = String(obj.private_key).replace(/\\n/g, "\n");
      return { client_email: obj.client_email, private_key: obj.private_key };
    } catch (error) {
      console.error('❌ Error decoding base64 key:', error);
    }
  }

  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
  if (!raw) {
    throw new Error("No Google service account key found");
  }

  if (raw.trim().startsWith("{")) {
    const obj = JSON.parse(raw);
    if (!obj.client_email || !obj.private_key) {
      throw new Error("Google service account key invalid");
    }
    obj.private_key = String(obj.private_key).replace(/\\n/g, "\n");
    return { client_email: obj.client_email, private_key: obj.private_key };
  }

  const pem = raw.includes("\\n") ? raw.replace(/\\n/g, "\n") : raw;
  return { client_email: process.env.GOOGLE_CLIENT_EMAIL, private_key: pem };
}

// Get calendar target ID
const CAL_TARGET = process.env.GOOGLE_CALENDAR_TARGET_ID || 
                   process.env.GOOGLE_CALENDAR_ID || 
                   'c_e98f5350bf743174f87e1a786038cb9d103c306b7246c6200684f81c37a6a764@group.calendar.google.com';

// Company display names
function getCompanyDisplayName(company) {
  const names = {
    'STARS_MC': 'Stars MC',
    'STARS_YACHTING': 'Stars Yachting',
    'STARS_REAL_ESTATE': 'Stars Real Estate',
    'LE_PNEU': 'Le Pneu',
    'MIDI_PNEU': 'Midi Pneu',
    'STARS_AVIATION': 'Stars Aviation',
  };
  return names[company] || company;
}

// Company colors
function getColorIdForCompany(company) {
  const colors = {
    'STARS_MC': '1',
    'STARS_YACHTING': '2',
    'STARS_REAL_ESTATE': '3',
    'LE_PNEU': '4',
    'MIDI_PNEU': '5',
    'STARS_AVIATION': '6',
  };
  return colors[company] || '1';
}

// Normalize vacation status
function normalizeVacationStatus(status) {
  if (!status) return 'pending';
  const s = status.toLowerCase().trim();
  if (['approved', 'validated', 'approve', 'ok', 'accepted'].includes(s)) return 'approved';
  if (['denied', 'rejected', 'reject', 'refused'].includes(s)) return 'denied';
  return 'pending';
}

// Add vacation to calendar
async function addVacationToCalendar(calendar, vacationEvent) {
  const { userName, startDate, endDate, type, company, reason } = vacationEvent;
  
  const start = new Date(startDate);
  const end = new Date(endDate);
  const endDateExclusive = new Date(end);
  endDateExclusive.setDate(endDateExclusive.getDate() + 1);
  
  const companyDisplayName = getCompanyDisplayName(company);
  const baseUrl = process.env.NEXTAUTH_URL || process.env.VERCEL_URL || 'https://vacation.stars.mc';
  
  const event = {
    summary: `${userName} - ${companyDisplayName}`,
    description: [
      `Name: ${userName}`,
      `Company: ${companyDisplayName}`,
      `Type: ${type || 'Full day'}`,
      `Date Range: ${start.toLocaleDateString('en-GB')} - ${end.toLocaleDateString('en-GB')}`,
      ...(reason ? [`Reason: ${reason}`] : []),
      `\nView in app: ${baseUrl}`
    ].join('\n'),
    start: { 
      date: start.toISOString().split('T')[0]
    },
    end: { 
      date: endDateExclusive.toISOString().split('T')[0]
    },
    transparency: 'transparent',
    colorId: getColorIdForCompany(company),
  };

  try {
    const response = await calendar.events.insert({
      calendarId: CAL_TARGET,
      requestBody: event,
    });
    return response.data.id;
  } catch (error) {
    console.error('Error adding event to calendar:', error);
    throw error;
  }
}

// Main sync function
async function forceSync() {
  try {
    console.log('🔄 Forcing sync of all approved vacation requests to Google Calendar...\n');
    
    // Load credentials
    const credentials = loadGoogleCreds();
    console.log('✅ Google Calendar credentials loaded');
    console.log(`   Service Account: ${credentials.client_email}`);
    console.log(`   Target Calendar: ${CAL_TARGET}\n`);
    
    // Initialize Google Calendar API
    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/calendar'],
    });
    const calendar = google.calendar({ version: 'v3', auth });
    
    console.log('📅 Fetching all vacation requests from Firestore...');
    const snapshot = await db.collection('vacationRequests').get();
    const requests = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    console.log(`📊 Found ${requests.length} total vacation requests`);
    
    // Filter approved requests
    const approvedRequests = requests.filter(req => {
      const normalizedStatus = normalizeVacationStatus(req.status);
      return normalizedStatus === 'approved';
    });
    
    console.log(`✅ Found ${approvedRequests.length} approved/validated requests\n`);
    
    // Find requests that need sync
    const requestsNeedingSync = approvedRequests.filter(req => {
      const hasEventId = req.calendarEventId || req.googleCalendarEventId || req.googleEventId;
      return !hasEventId; // Only sync requests without event IDs
    });
    
    console.log(`🔄 Found ${requestsNeedingSync.length} requests that need syncing\n`);
    
    if (requestsNeedingSync.length === 0) {
      console.log('✅ All approved requests are already synced!');
      return;
    }
    
    // Sync each request
    let successCount = 0;
    let errorCount = 0;
    const errors = [];
    
    for (const req of requestsNeedingSync) {
      try {
        console.log(`📅 Syncing request ${req.id} (${req.userName || 'Unknown'})...`);
        
        const vacationEvent = {
          userName: req.userName || 'Unknown',
          startDate: req.startDate,
          endDate: req.endDate,
          type: req.type || 'VACATION',
          company: req.company || 'Unknown',
          reason: req.reason || 'N/A'
        };
        
        const eventId = await addVacationToCalendar(calendar, vacationEvent);
        console.log(`✅ Created calendar event: ${eventId}`);
        
        // Store the event ID in Firestore
        await db.collection('vacationRequests').doc(req.id).update({
          calendarEventId: eventId,
          googleCalendarEventId: eventId,
          googleEventId: eventId,
          calendarSyncedAt: new Date().toISOString()
        });
        
        console.log(`💾 Stored event ID in Firestore\n`);
        successCount++;
        
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        console.error(`❌ Failed to sync request ${req.id}:`, errorMsg);
        errors.push({ id: req.id, error: errorMsg });
        errorCount++;
      }
    }
    
    console.log('\n' + '='.repeat(80));
    console.log('🎉 Sync completed!');
    console.log('='.repeat(80));
    console.log(`✅ Successfully synced: ${successCount} requests`);
    console.log(`❌ Failed to sync: ${errorCount} requests`);
    
    if (errors.length > 0) {
      console.log('\n❌ Errors:');
      errors.forEach((error, index) => {
        console.log(`   ${index + 1}. Request ${error.id}: ${error.error}`);
      });
    }
    
    if (successCount > 0) {
      console.log('\n📅 Check your Google Calendar to see the synced events!');
    }
    
  } catch (error) {
    console.error('❌ Sync failed:', error);
    process.exit(1);
  }
}

// Run the sync
forceSync().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
