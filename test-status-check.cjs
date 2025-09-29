const { chromium } = require('playwright');

async function checkStatus() {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  try {
    console.log('🧪 Checking current status...');
    
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
      
      // Look for all table rows
      const allRows = await page.locator('tbody tr').count();
      console.log(`📊 Total table rows: ${allRows}`);
      
      // Look for different status indicators
      const pendingRows = await page.locator('tr:has-text("pending")').count();
      const approvedRows = await page.locator('tr:has-text("approved")').count();
      const rejectedRows = await page.locator('tr:has-text("rejected")').count();
      
      console.log(`📊 Pending rows: ${pendingRows}`);
      console.log(`📊 Approved rows: ${approvedRows}`);
      console.log(`📊 Rejected rows: ${rejectedRows}`);
      
      // Look for approve/reject buttons
      const approveButtons = await page.locator('button:has-text("Approve")').count();
      const rejectButtons = await page.locator('button:has-text("Reject")').count();
      
      console.log(`📊 Approve buttons: ${approveButtons}`);
      console.log(`📊 Reject buttons: ${rejectButtons}`);
      
      // Look for status badges
      const statusBadges = await page.locator('[class*="bg-green"], [class*="bg-red"], [class*="bg-yellow"]').count();
      console.log(`📊 Status badges: ${statusBadges}`);
      
      // Get some sample text from the table
      const tableText = await page.locator('tbody').first().textContent();
      console.log('📄 Table content sample:');
      console.log(tableText?.substring(0, 200) + '...');
      
    } else {
      console.log('❌ Not on admin page after login');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await browser.close();
  }
}

checkStatus();






