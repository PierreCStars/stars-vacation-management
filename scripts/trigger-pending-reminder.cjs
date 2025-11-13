#!/usr/bin/env node
/**
 * Script to manually trigger the 5-day pending vacation request reminder
 * 
 * Usage:
 *   node scripts/trigger-pending-reminder.cjs
 * 
 * This script directly calls the reminder function and sends emails to admins
 * for all pending vacation requests that haven't been reminded in the last 5 days.
 */

require('dotenv').config({ path: '.env.local' });

async function triggerReminder() {
  try {
    console.log('📧 Triggering 5-day pending vacation request reminder...\n');

    // Import the reminder function
    const { runPendingReminder5d } = require('../src/lib/cron/pendingReminder5d.ts');

    // Run the reminder
    const result = await runPendingReminder5d();

    // Display results
    console.log('\n📊 Reminder Results:');
    console.log('='.repeat(50));
    console.log(`Success: ${result.success ? '✅' : '❌'}`);
    console.log(`Total Pending: ${result.totalPending}`);
    console.log(`Included in Reminder: ${result.included}`);
    console.log(`Excluded (recently reminded): ${result.excluded}`);
    console.log(`Admins Notified: ${result.notified}`);
    console.log(`Errors: ${result.errors}`);
    
    if (result.errorDetails && result.errorDetails.length > 0) {
      console.log('\n❌ Errors:');
      result.errorDetails.forEach((err, idx) => {
        console.log(`  ${idx + 1}. ${err}`);
      });
    }

    console.log(`\nTimestamp: ${result.timestamp}`);
    console.log('='.repeat(50));

    if (result.success && result.included > 0) {
      console.log(`\n✅ Successfully sent reminder for ${result.included} pending request${result.included !== 1 ? 's' : ''}`);
      console.log(`📧 Email sent to ${result.notified} admin${result.notified !== 1 ? 's' : ''}`);
    } else if (result.included === 0) {
      console.log('\nℹ️  No pending requests need reminder at this time.');
      console.log('   (All pending requests were reminded within the last 5 days)');
    } else {
      console.log('\n❌ Reminder process completed with errors');
      process.exit(1);
    }

  } catch (error) {
    console.error('\n❌ Error triggering reminder:', error);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

// Run the script
triggerReminder();

