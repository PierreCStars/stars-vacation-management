const { chromium } = require('playwright');

async function testHydration() {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  // Listen for console errors and warnings
  const errors = [];
  const warnings = [];
  const logs = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
    } else if (msg.type() === 'warning') {
      warnings.push(msg.text());
    } else {
      logs.push(msg.text());
    }
  });
  
  // Listen for network errors
  const networkErrors = [];
  page.on('response', response => {
    if (!response.ok()) {
      networkErrors.push(`${response.status()} ${response.url()}`);
    }
  });
  
  // Listen for JavaScript errors
  const jsErrors = [];
  page.on('pageerror', error => {
    jsErrors.push(error.message);
  });
  
  // Listen for page errors
  const pageErrors = [];
  page.on('crash', error => {
    pageErrors.push(error.message);
  });
  
  // Listen for request errors
  const requestErrors = [];
  page.on('requestfailed', request => {
    requestErrors.push(`${request.failure().errorText} ${request.url()}`);
  });
  
  // Listen for response errors
  const responseErrors = [];
  page.on('response', response => {
    if (response.status() >= 400) {
      responseErrors.push(`${response.status()} ${response.url()}`);
    }
  });
  
  // Listen for timeout errors
  const timeoutErrors = [];
  page.on('requestfailed', request => {
    if (request.failure().errorText === 'net::ERR_TIMED_OUT') {
      timeoutErrors.push(`${request.failure().errorText} ${request.url()}`);
    }
  });
  
  // Listen for connection errors
  const connectionErrors = [];
  page.on('requestfailed', request => {
    if (request.failure().errorText === 'net::ERR_CONNECTION_REFUSED') {
      connectionErrors.push(`${request.failure().errorText} ${request.url()}`);
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
    
    // Log all console warnings for debugging
    if (warnings.length > 0) {
      console.log('⚠️ All console warnings:');
      warnings.forEach(warning => console.log('  -', warning));
    }
    
    // Log all console logs for debugging
    if (logs.length > 0) {
      console.log('📝 All console logs:');
      logs.forEach(log => console.log('  -', log));
    }
    
    // Log all network errors for debugging
    if (networkErrors.length > 0) {
      console.log('🌐 All network errors:');
      networkErrors.forEach(error => console.log('  -', error));
    }
    
    // Log all JavaScript errors for debugging
    if (jsErrors.length > 0) {
      console.log('💥 All JavaScript errors:');
      jsErrors.forEach(error => console.log('  -', error));
    }
    
    // Log all page errors for debugging
    if (pageErrors.length > 0) {
      console.log('💥 All page errors:');
      pageErrors.forEach(error => console.log('  -', error));
    }
    
    // Log all request errors for debugging
    if (requestErrors.length > 0) {
      console.log('🌐 All request errors:');
      requestErrors.forEach(error => console.log('  -', error));
    }
    
    // Log all response errors for debugging
    if (responseErrors.length > 0) {
      console.log('🌐 All response errors:');
      responseErrors.forEach(error => console.log('  -', error));
    }
    
    // Log all timeout errors for debugging
    if (timeoutErrors.length > 0) {
      console.log('⏰ All timeout errors:');
      timeoutErrors.forEach(error => console.log('  -', error));
    }
    
    // Log all connection errors for debugging
    if (connectionErrors.length > 0) {
      console.log('🔌 All connection errors:');
      connectionErrors.forEach(error => console.log('  -', error));
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






