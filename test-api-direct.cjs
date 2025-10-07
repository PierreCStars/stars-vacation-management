const { chromium } = require('playwright');

async function testAPI() {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  try {
    console.log('🧪 Testing API directly...');
    
    // Navigate to the admin page
    await page.goto('http://localhost:3000/en/admin/vacation-requests');
    
    // Wait for the page to load
    await page.waitForLoadState('networkidle');
    
    // Wait a bit more for any async operations
    await page.waitForTimeout(3000);
    
    // Check if we're redirected to signin
    const currentUrl = page.url();
    console.log('📍 Current URL:', currentUrl);
    
    if (currentUrl.includes('/auth/signin')) {
      console.log('🔐 Redirected to signin page - authentication required');
      
      // Try to sign in with Google (this might not work in headless mode)
      const googleButton = await page.locator('button:has-text("Google")').first();
      if (await googleButton.isVisible()) {
        console.log('🔍 Google signin button found');
        // Don't actually click it as it requires real authentication
      }
    } else {
      console.log('✅ On admin page - checking for buttons');
      
      // Look for approve/reject buttons
      const approveButtons = await page.locator('button:has-text("Approve")').count();
      const rejectButtons = await page.locator('button:has-text("Reject")').count();
      
      console.log(`📊 Found ${approveButtons} approve buttons and ${rejectButtons} reject buttons`);
      
      if (approveButtons > 0) {
        console.log('✅ Approve buttons are visible');
      } else {
        console.log('⚠️ No approve buttons found');
      }
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

testAPI();












