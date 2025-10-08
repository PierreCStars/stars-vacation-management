#!/usr/bin/env node

/**
 * Sync all approved vacation requests to Google Calendar
 * This script will ensure all approved requests appear in the calendar
 */

const { initializeApp, cert, getApps } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const { google } = require('googleapis');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

// Initialize Firebase Admin
function initFirebase() {
  if (getApps().length > 0) {
    return getApps()[0];
  }

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n');

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error('Missing Firebase Admin environment variables');
  }

  return initializeApp({
    credential: cert({ projectId, clientEmail, privateKey }),
  });
}

// Initialize Google Calendar
function initGoogleCalendar() {
  const serviceAccountKey = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
  if (!serviceAccountKey) {
    throw new Error('Missing GOOGLE_SERVICE_ACCOUNT_KEY');
  }

  const credentials = JSON.parse(serviceAccountKey);
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/calendar'],
  });

  return google.calendar({ version: 'v3', auth });
}

// Normalize status function (copied from types)
function normalizeVacationStatus(input) {
  if (!input) return 'pending';
  const s = String(input).toLowerCase().trim();
  if (s === 'approved' || s === 'approve' || s === 'ok' || s === 'accepted') return 'approved';
  if (s === 'denied' || s === 'reject' || s === 'rejected' || s === 'declined') return 'denied';
  return 'pending';
}

// Add vacation to calendar
async function addVacationToCalendar(calendar, vacationEvent) {
  const { userName, startDate, endDate, type, company, reason } = vacationEvent;
  
  const event = {
    summary: `${userName} - ${company}`,
    description: `Vacation Request\nName: ${userName}\nCompany: ${company}\nType: ${type}\nReason: ${reason || 'N/A'}`,
    start: { date: startDate },
    end: { date: endDate },
    transparency: 'opaque',
    colorId: '2', // Default color
  };

  try {
    const response = await calendar.events.insert({
      calendarId: process.env.GOOGLE_CALENDAR_TARGET_ID || 'primary',
      requestBody: event,
    });
    return response.data.id;
  } catch (error) {
    console.error('Error adding event to calendar:', error);
    throw error;
  }
}

// Main sync function
async function syncApprovedRequests() {
  try {
    console.log('🚀 Starting sync of approved vacation requests...');
    
    // Initialize services
    const app = initFirebase();
    const db = getFirestore(app);
    const calendar = initGoogleCalendar();
    
    console.log('✅ Firebase and Google Calendar initialized');
    
    // Get all vacation requests
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
    
    console.log(`✅ Found ${approvedRequests.length} approved requests`);
    
    // Check which ones need calendar events
    const requestsNeedingSync = [];
    for (const req of approvedRequests) {
      const docRef = db.collection('vacationRequests').doc(req.id);
      const doc = await docRef.get();
      const existingData = doc.data();
      const existingEventId = existingData?.calendarEventId;
      
      if (!existingEventId) {
        requestsNeedingSync.push(req);
      } else {
        console.log(`⏭️  Request ${req.id} already has calendar event: ${existingEventId}`);
      }
    }
    
    console.log(`🔄 ${requestsNeedingSync.length} requests need calendar sync`);
    
    // Sync each request
    let successCount = 0;
    let errorCount = 0;
    
    for (const req of requestsNeedingSync) {
      try {
        console.log(`📅 Syncing request ${req.id} (${req.userName})...`);
        
        const vacationEvent = {
          userName: req.userName,
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
          calendarSyncedAt: new Date().toISOString()
        });
        
        console.log(`💾 Stored event ID in Firestore`);
        successCount++;
        
      } catch (error) {
        console.error(`❌ Failed to sync request ${req.id}:`, error.message);
        errorCount++;
      }
    }
    
    console.log('\n🎉 Sync completed!');
    console.log(`✅ Successfully synced: ${successCount} requests`);
    console.log(`❌ Failed to sync: ${errorCount} requests`);
    
    if (successCount > 0) {
      console.log('\n📅 Check your Google Calendar to see the synced events!');
    }
    
  } catch (error) {
    console.error('❌ Sync failed:', error);
    process.exit(1);
  }
}

// Run the sync
syncApprovedRequests();
