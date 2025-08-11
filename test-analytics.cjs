const https = require('https');

const url = 'https://stars-vacation-management.vercel.app/api/vacation-analytics';

console.log('🧪 Testing Analytics API...');
console.log(`URL: ${url}`);

const req = https.get(url, (res) => {
  console.log(`Status: ${res.statusCode}`);
  console.log(`Headers:`, res.headers);
  
  let data = '';
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    try {
      const jsonData = JSON.parse(data);
      console.log('\n✅ Response received:');
      console.log(JSON.stringify(jsonData, null, 2));
      
      if (jsonData.success) {
        console.log('\n🎉 Analytics API is working!');
        console.log(`Total vacations: ${jsonData.data.totalVacations}`);
        console.log(`Total days: ${jsonData.data.totalDays}`);
        console.log(`People: ${jsonData.data.byPerson.length}`);
        console.log(`Companies: ${jsonData.data.byCompany.length}`);
        console.log(`Types: ${jsonData.data.byType.length}`);
      } else {
        console.log('\n❌ API returned error:', jsonData.error);
      }
    } catch (error) {
      console.log('\n❌ Failed to parse response:', error.message);
      console.log('Raw response:', data);
    }
  });
});

req.on('error', (error) => {
  console.error('\n❌ Request failed:', error.message);
});

req.end();
