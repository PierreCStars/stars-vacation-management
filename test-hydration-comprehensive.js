const { chromium } = require('playwright');

async function testHydration() {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  // Listen for console errors
  const errors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
    }
  });
  
  try {
    console.log('🧪 Testing hydration on admin vacation requests page...');
    
    // Navigate to the admin page
    await page.goto('http://localhost:3000/en/admin/vacation-requests');
    
    // Wait for the page to load
    await page.waitForLoadState('networkidle');
    
    // Wait a bit more for any async operations
    await page.waitForTimeout(5000);
    
    // Check for hydration errors
    const hydrationErrors = errors.filter(error => 
      error.includes('Hydration failed') || 
      error.includes('Text content does not match') ||
      error.includes('Hydration text mismatch') ||
      error.includes('Hydration') ||
      error.includes('hydration')
    );
    
    if (hydrationErrors.length > 0) {
      console.error('❌ Hydration errors found:');
      hydrationErrors.forEach(error => console.error('  -', error));
      process.exit(1);
    } else {
      console.log('✅ No hydration errors found!');
    }
    
    // Log all console errors for debugging
    if (errors.length > 0) {
      console.log('📝 All console errors:');
      errors.forEach(error => console.log('  -', error));
    }
    
    // Check if the page loaded correctly
    const title = await page.title();
    console.log('📄 Page title:', title);
    
    // Check if the main content is visible
    const mainContent = await page.locator('h1').first();
    if (await mainContent.isVisible()) {
      console.log('✅ Main content is visible');
    } else {
      console.error('❌ Main content is not visible');
      process.exit(1);
    }
    
    // Check if the calendar is visible
    const calendar = await page.locator('[class*="calendar"]').first();
    if (await calendar.isVisible()) {
      console.log('✅ Calendar is visible');
    } else {
      console.log('⚠️ Calendar is not visible (may be loading)');
    }
    
    // Check if the Firebase debug panel is visible
    const firebasePanel = await page.locator('[class*="Firebase"]').first();
    if (await firebasePanel.isVisible()) {
      console.log('✅ Firebase debug panel is visible');
    } else {
      console.log('⚠️ Firebase debug panel is not visible (may be loading)');
    }
    
    // Check if the vacation requests table is visible
    const table = await page.locator('table').first();
    if (await table.isVisible()) {
      console.log('✅ Vacation requests table is visible');
    } else {
      console.log('⚠️ Vacation requests table is not visible (may be loading)');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

testHydration();






