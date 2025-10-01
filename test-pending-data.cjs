const { chromium } = require('playwright');

async function checkPendingData() {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  try {
    console.log('🧪 Checking pending data...');
    
    // Navigate to the admin page
    await page.goto('http://localhost:3000/en/admin/vacation-requests');
    
    // Wait for the page to load
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // Check if we need to sign in
    const currentUrl = page.url();
    if (currentUrl.includes('/auth/signin')) {
      console.log('🔐 Signing in...');
      
      const emailField = await page.locator('input[type="email"]').first();
      const passwordField = await page.locator('input[type="password"]').first();
      const submitButton = await page.locator('button[type="submit"]').first();
      
      await emailField.fill('admin@stars.mc');
      await passwordField.fill('password');
      await submitButton.click();
      
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(3000);
    }
    
    // Now we should be on the admin page
    const finalUrl = page.url();
    console.log('📍 Final URL:', finalUrl);
    
    if (finalUrl.includes('/admin/vacation-requests')) {
      console.log('✅ On admin page');
      
      // Look for the pending section specifically
      const pendingSection = await page.locator('section:has(h2:has-text("Pending"))').count();
      console.log(`📊 Pending sections found: ${pendingSection}`);
      
      // Look for the pending table
      const pendingTable = await page.locator('section:has(h2:has-text("Pending")) table').count();
      console.log(`📊 Pending tables found: ${pendingTable}`);
      
      // Look for pending table rows
      const pendingTableRows = await page.locator('section:has(h2:has-text("Pending")) tbody tr').count();
      console.log(`📊 Pending table rows: ${pendingTableRows}`);
      
      // Look for the "No pending requests" message
      const noPendingMessage = await page.locator('text="No pending requests"').count();
      console.log(`📊 "No pending requests" messages: ${noPendingMessage}`);
      
      // Look for the "All vacation requests reviewed" message
      const allReviewedMessage = await page.locator('text="All vacation requests reviewed"').count();
      console.log(`📊 "All vacation requests reviewed" messages: ${allReviewedMessage}`);
      
      // Look for the reviewed section
      const reviewedSection = await page.locator('section:has(h2:has-text("Reviewed"))').count();
      console.log(`📊 Reviewed sections found: ${reviewedSection}`);
      
      // Look for reviewed table rows
      const reviewedTableRows = await page.locator('section:has(h2:has-text("Reviewed")) tbody tr').count();
      console.log(`📊 Reviewed table rows: ${reviewedTableRows}`);
      
      // Get the text content of the pending section
      const pendingSectionText = await page.locator('section:has(h2:has-text("Pending"))').first().textContent();
      console.log('📄 Pending section content:');
      console.log(pendingSectionText?.substring(0, 300) + '...');
      
    } else {
      console.log('❌ Not on admin page after login');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await browser.close();
  }
}

checkPendingData();









