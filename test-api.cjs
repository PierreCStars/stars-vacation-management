const { chromium } = require('playwright');

async function testApproval() {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  try {
    console.log('🧪 Testing vacation request approval...');
    
    // Navigate to the admin page
    await page.goto('http://localhost:3000/en/admin/vacation-requests');
    
    // Wait for the page to load
    await page.waitForLoadState('networkidle');
    
    // Wait a bit more for any async operations
    await page.waitForTimeout(3000);
    
    // Look for approve/reject buttons
    const approveButtons = await page.locator('button:has-text("Approve")').count();
    const rejectButtons = await page.locator('button:has-text("Reject")').count();
    
    console.log(`📊 Found ${approveButtons} approve buttons and ${rejectButtons} reject buttons`);
    
    if (approveButtons > 0) {
      console.log('✅ Approve buttons are visible');
      
      // Click the first approve button
      await page.locator('button:has-text("Approve")').first().click();
      
      // Wait for the request to complete
      await page.waitForTimeout(2000);
      
      // Check if the page refreshed or if there are any error messages
      const errorMessages = await page.locator('[class*="error"], [class*="Error"]').count();
      if (errorMessages > 0) {
        console.log('❌ Error messages found after clicking approve');
        const errors = await page.locator('[class*="error"], [class*="Error"]').allTextContents();
        console.log('Errors:', errors);
      } else {
        console.log('✅ No error messages found after clicking approve');
      }
      
      // Check if the status changed
      const statusElements = await page.locator('[class*="status"], [class*="Status"]').count();
      console.log(`📊 Found ${statusElements} status elements`);
      
    } else {
      console.log('⚠️ No approve buttons found - may need authentication');
    }
    
    // Check console for any errors
    const errors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    
    if (errors.length > 0) {
      console.log('📝 Console errors:');
      errors.forEach(error => console.log('  -', error));
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await browser.close();
  }
}

testApproval();






