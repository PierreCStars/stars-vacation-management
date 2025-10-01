/**
 * Test script to check analytics database structure
 * Run with: node test-analytics-db.cjs
 */

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000';

async function testAnalyticsDatabase() {
  console.log('🧪 Testing Analytics Database Structure');
  console.log('=======================================');
  
  try {
    // Test 1: Check analytics API response
    console.log('\n1. Testing analytics API...');
    const response = await fetch(`${BASE_URL}/api/analytics/vacations?status=all`);
    
    if (!response.ok) {
      console.log('❌ Analytics API failed:', response.status, response.statusText);
      return;
    }
    
    const data = await response.json();
    console.log('✅ Analytics API response received');
    console.log('📊 Meta:', data.meta);
    console.log('👥 Employee count:', data.employees?.length || 0);
    console.log('📈 Type frequency:', data.freqByType?.length || 0);
    console.log('🏢 Company count:', data.companyKeys?.length || 0);
    
    // Test 2: Check sample employee data
    if (data.employees && data.employees.length > 0) {
      console.log('\n2. Sample employee data:');
      const sample = data.employees[0];
      console.log('📋 Sample employee:', JSON.stringify(sample, null, 2));
      
      // Check for missing fields
      const requiredFields = ['userName', 'company', 'totalDays', 'count', 'avg'];
      const missingFields = requiredFields.filter(field => sample[field] === undefined);
      if (missingFields.length > 0) {
        console.log('⚠️ Missing fields in employee data:', missingFields);
      } else {
        console.log('✅ All required employee fields present');
      }
    }
    
    // Test 3: Check type frequency data
    if (data.freqByType && data.freqByType.length > 0) {
      console.log('\n3. Type frequency data:');
      data.freqByType.forEach((item, index) => {
        console.log(`   ${index + 1}. ${item.type}: ${item.count}`);
      });
    }
    
    // Test 4: Check company data
    if (data.freqByCompanyStack && data.freqByCompanyStack.length > 0) {
      console.log('\n4. Company frequency data:');
      data.freqByCompanyStack.forEach((item, index) => {
        console.log(`   ${index + 1}. ${item.company}:`, Object.keys(item).filter(k => k !== 'company'));
      });
    }
    
    // Test 5: Check for data consistency issues
    console.log('\n5. Data consistency checks:');
    
    // Check for null/undefined values
    const nullEmployees = data.employees?.filter(emp => 
      !emp.userName || !emp.company || emp.totalDays === undefined
    ) || [];
    
    if (nullEmployees.length > 0) {
      console.log('⚠️ Employees with missing data:', nullEmployees.length);
      nullEmployees.forEach(emp => {
        console.log('   - Missing data:', {
          userName: emp.userName,
          company: emp.company,
          totalDays: emp.totalDays
        });
      });
    } else {
      console.log('✅ No missing employee data found');
    }
    
    // Check for negative values
    const negativeDays = data.employees?.filter(emp => emp.totalDays < 0) || [];
    if (negativeDays.length > 0) {
      console.log('⚠️ Employees with negative days:', negativeDays.length);
    } else {
      console.log('✅ No negative day values found');
    }
    
    // Test 6: Check different status filters
    console.log('\n6. Testing different status filters...');
    const statuses = ['approved', 'pending', 'rejected', 'all'];
    
    for (const status of statuses) {
      try {
        const statusResponse = await fetch(`${BASE_URL}/api/analytics/vacations?status=${status}`);
        const statusData = await statusResponse.json();
        console.log(`   ${status}: ${statusData.meta?.totalRequests || 0} requests`);
      } catch (err) {
        console.log(`   ${status}: Error - ${err.message}`);
      }
    }
    
    console.log('\n🎉 Analytics database test completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testAnalyticsDatabase();

