const { chromium } = require('playwright');

async function testApprovalFinal() {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  try {
    console.log('🧪 Testing approval functionality...');
    
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
      
      // Look for pending requests
      const pendingRows = await page.locator('tbody tr').count();
      console.log(`📊 Found ${pendingRows} table rows`);
      
      // Look for approve/reject buttons
      const approveButtons = await page.locator('button:has-text("Approve")').count();
      const rejectButtons = await page.locator('button:has-text("Reject")').count();
      
      console.log(`📊 Found ${approveButtons} approve buttons and ${rejectButtons} reject buttons`);
      
      if (approveButtons > 0) {
        console.log('🖱️ Clicking approve button...');
        
        // Click the first approve button
        await page.locator('button:has-text("Approve")').first().click();
        
        // Wait for the request to complete
        await page.waitForTimeout(5000);
        
        // Check if the page refreshed (which would indicate success)
        const newUrl = page.url();
        console.log('📍 URL after approval:', newUrl);
        
        // Look for success indicators
        const successMessages = await page.locator('[class*="success"], [class*="Success"]').count();
        const errorMessages = await page.locator('[class*="error"], [class*="Error"]').count();
        
        console.log(`📊 Found ${successMessages} success messages and ${errorMessages} error messages`);
        
        if (errorMessages > 0) {
          const errors = await page.locator('[class*="error"], [class*="Error"]').allTextContents();
          console.log('❌ Errors found:', errors);
        } else {
          console.log('✅ No errors found - approval likely successful');
        }
        
        // Check if the approve button is still there (should be gone if successful)
        const remainingApproveButtons = await page.locator('button:has-text("Approve")').count();
        console.log(`📊 Remaining approve buttons: ${remainingApproveButtons}`);
        
        if (remainingApproveButtons < approveButtons) {
          console.log('✅ Approve button disappeared - request was processed');
        } else {
          console.log('⚠️ Approve button still present - may need page refresh');
        }
        
      } else {
        console.log('⚠️ No approve buttons found - no pending requests?');
      }
      
    } else {
      console.log('❌ Not on admin page after login');
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

testApprovalFinal();










