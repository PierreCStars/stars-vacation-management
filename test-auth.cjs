const { chromium } = require('playwright');

async function testWithAuth() {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  try {
    console.log('🧪 Testing with authentication...');
    
    // Navigate to the admin page
    await page.goto('http://localhost:3000/en/admin/vacation-requests');
    
    // Wait for the page to load
    await page.waitForLoadState('networkidle');
    
    // Wait a bit more for any async operations
    await page.waitForTimeout(2000);
    
    // Check if we're redirected to signin
    const currentUrl = page.url();
    console.log('📍 Current URL:', currentUrl);
    
    if (currentUrl.includes('/auth/signin')) {
      console.log('🔐 On signin page - trying development login');
      
      // Look for development login form
      const emailField = await page.locator('input[type="email"]').first();
      const passwordField = await page.locator('input[type="password"]').first();
      const submitButton = await page.locator('button[type="submit"]').first();
      
      if (await emailField.isVisible() && await passwordField.isVisible() && await submitButton.isVisible()) {
        console.log('✅ Development login form found');
        
        // Fill in development credentials
        await emailField.fill('admin@stars.mc');
        await passwordField.fill('password');
        
        // Submit the form
        await submitButton.click();
        
        // Wait for redirect
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(3000);
        
        const newUrl = page.url();
        console.log('📍 New URL after login:', newUrl);
        
        if (newUrl.includes('/admin/vacation-requests')) {
          console.log('✅ Successfully logged in and redirected to admin page');
          
          // Now look for approve/reject buttons
          const approveButtons = await page.locator('button:has-text("Approve")').count();
          const rejectButtons = await page.locator('button:has-text("Reject")').count();
          
          console.log(`📊 Found ${approveButtons} approve buttons and ${rejectButtons} reject buttons`);
          
          if (approveButtons > 0) {
            console.log('✅ Approve buttons are visible');
            
            // Click the first approve button
            console.log('🖱️ Clicking approve button...');
            await page.locator('button:has-text("Approve")').first().click();
            
            // Wait for the request to complete
            await page.waitForTimeout(3000);
            
            // Check if the page refreshed or if there are any error messages
            const errorMessages = await page.locator('[class*="error"], [class*="Error"]').count();
            if (errorMessages > 0) {
              console.log('❌ Error messages found after clicking approve');
              const errors = await page.locator('[class*="error"], [class*="Error"]').allTextContents();
              console.log('Errors:', errors);
            } else {
              console.log('✅ No error messages found after clicking approve');
            }
            
            // Check if the status changed by looking for different status indicators
            const statusElements = await page.locator('[class*="status"], [class*="Status"]').count();
            console.log(`📊 Found ${statusElements} status elements`);
            
          } else {
            console.log('⚠️ No approve buttons found after login');
          }
          
        } else {
          console.log('❌ Login failed or not redirected to admin page');
        }
        
      } else {
        console.log('❌ Development login form not found');
      }
      
    } else {
      console.log('✅ Already on admin page - checking for buttons');
      
      // Look for approve/reject buttons
      const approveButtons = await page.locator('button:has-text("Approve")').count();
      const rejectButtons = await page.locator('button:has-text("Reject")').count();
      
      console.log(`📊 Found ${approveButtons} approve buttons and ${rejectButtons} reject buttons`);
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

testWithAuth();
