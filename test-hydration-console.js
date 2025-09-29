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
    await page.waitForTimeout(3000);
    
    // Check for hydration errors
    const hydrationErrors = errors.filter(error => 
      error.includes('Hydration failed') || 
      error.includes('Text content does not match') ||
      error.includes('Hydration text mismatch')
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
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

testHydration();






