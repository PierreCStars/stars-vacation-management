// Enhanced diagnostic and fix script for vacation request calendar sync
// Copy and paste this entire script into the browser console

(async function() {
  const requestId = '9cvcfGrFqicZFNPxkffQ';
  
  // Helper function to force sync (defined first so it can be used)
  async function forceSync(id, forceRecreate = false) {
    const url = `/api/sync/request/${id}${forceRecreate ? '?force=true' : ''}`;
    console.log(`🔄 ${forceRecreate ? 'Force recreating' : 'Syncing'}...`);
    console.log('URL:', url);
    
    try {
      const syncResponse = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      const syncData = await syncResponse.json();
      console.log('---');
      
      if (syncData.success) {
        console.log('✅ SUCCESS!');
        console.log(' Event ID:', syncData.eventId);
        console.log(' Message:', syncData.message);
        console.log(' Calendar ID:', syncData.calendarId || 'Not specified');
        if (syncData.clearedStaleEventId) {
          console.log(' Cleared Stale Event ID: Yes');
        }
        if (syncData.forceRecreated) {
          console.log(' Force Recreated: Yes');
          console.log(' Previous Event ID:', syncData.previousEventId || 'None');
        }
        console.log('---');
        console.log('📅 The event should now appear in Google Calendar!');
        console.log('→ Refresh the calendar view to see the new event');
      } else {
        console.error('❌ FAILED to sync:');
        console.error(' Error:', syncData.error);
        console.error(' Details:', syncData);
      }
    } catch (error) {
      console.error('❌ Error during sync:', error);
      console.error('Stack:', error.stack);
    }
  }
  
  // Make forceSync available globally for manual use
  window.forceSync = forceSync;
  
  console.log('🔍 Checking vacation request:', requestId);
  console.log('---');
  
  try {
    // Step 1: Check status
    const checkResponse = await fetch(`/api/sync/request/${requestId}`);
    const checkData = await checkResponse.json();
    
    console.log('📊 Diagnostic Results:');
    console.log(JSON.stringify(checkData, null, 2));
    console.log('---');
    
    if (checkData.error) {
      console.error('❌ Error:', checkData.error);
      return;
    }
    
    // Display key information
    console.log('📋 Request Info:');
    console.log(' ID:', checkData.id);
    console.log(' Status:', checkData.status);
    console.log(' Normalized Status:', checkData.normalizedStatus);
    console.log(' Is Approved:', checkData.isApproved ? '✅ YES' : '❌ NO');
    console.log(' Has Event ID:', checkData.hasEventId ? '✅ YES' : '❌ NO');
    console.log(' Event ID:', checkData.eventId || 'None');
    console.log(' Calendar ID:', checkData.calendarId || 'Not specified');
    console.log(' Calendar Event Exists:', checkData.calendarEventExists ? '✅ YES' : '❌ NO');
    
    if (checkData.calendarEventDetails) {
      console.log('---');
      console.log('📅 Calendar Event Details:');
      console.log(' Summary:', checkData.calendarEventDetails.summary);
      console.log(' Start:', checkData.calendarEventDetails.start);
      console.log(' End:', checkData.calendarEventDetails.end);
      console.log(' Status:', checkData.calendarEventDetails.status);
      console.log(' Visibility:', checkData.calendarEventDetails.visibility || 'default');
      console.log(' Transparency:', checkData.calendarEventDetails.transparency || 'default');
      console.log(' Event Link:', checkData.calendarEventDetails.htmlLink);
    }
    
    if (checkData.calendarError) {
      console.log(' ⚠️ Calendar Error:', checkData.calendarError);
    }
    
    console.log('---');
    console.log('📈 Sync Status:');
    console.log(' Needs Sync:', checkData.syncStatus?.needsSync ? '✅ YES' : '❌ NO');
    console.log(' Needs Recreate:', checkData.syncStatus?.needsRecreate ? '✅ YES' : '❌ NO');
    console.log(' Is Synced:', checkData.syncStatus?.isSynced ? '✅ YES' : '❌ NO');
    console.log(' Can Force Recreate:', checkData.syncStatus?.canForceRecreate ? '✅ YES' : '❌ NO');
    
    console.log('---');
    
    // Step 2: Determine action
    if (!checkData.isApproved) {
      console.log('⚠️ Request is not approved/validated');
      console.log(' Status:', checkData.status);
      console.log(' → Approve the request first, then sync');
      return;
    }
    
    if (checkData.syncStatus?.needsSync) {
      console.log('🔄 Event needs to be created...');
      await forceSync(requestId);
    } else if (checkData.syncStatus?.needsRecreate) {
      console.log('🔄 Event ID exists but event is missing, recreating...');
      await forceSync(requestId);
    } else if (checkData.syncStatus?.isSynced) {
      console.log('✅ Request is already synced!');
      
      if (checkData.calendarEventDetails?.htmlLink) {
        console.log('---');
        console.log('🔗 Event Link:', checkData.calendarEventDetails.htmlLink);
        console.log('→ Click the link above to verify the event in Google Calendar');
        console.log('---');
        console.log('💡 If the event is not visible in the calendar:');
        console.log('   1. Check if you have access to the calendar');
        console.log('   2. Check if the event is on the correct calendar');
        console.log('   3. Try force recreating with: await forceSync("' + requestId + '", true)');
      }
      
      // Ask if user wants to force recreate
      console.log('---');
      console.log('🔄 To force recreate the event (even if it exists), run:');
      console.log(`   await forceSync('${requestId}', true)`);
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
    console.error('Stack:', error.stack);
  }
  
  console.log('---');
  console.log('💡 Tip: You can manually force sync by calling:');
  console.log(`   await forceSync('${requestId}', true)`);
})();
