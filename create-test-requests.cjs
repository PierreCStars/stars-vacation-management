const fs = require('fs');

console.log('🧪 Creating test vacation requests...\n');

// Create a simple test data file
const testRequests = [
  {
    id: 'test-request-1',
    userId: 'test-user-1',
    userName: 'John Doe',
    userEmail: 'john.doe@stars.mc',
    company: 'Stars Monaco',
    type: 'annual',
    startDate: '2024-12-15',
    endDate: '2024-12-20',
    duration: 5,
    reason: 'Family vacation',
    status: 'pending',
    createdAt: new Date().toISOString(),
    conflicts: []
  },
  {
    id: 'test-request-2',
    userId: 'test-user-2',
    userName: 'Jane Smith',
    userEmail: 'jane.smith@stars.mc',
    company: 'Stars Monaco',
    type: 'annual',
    startDate: '2024-12-25',
    endDate: '2024-12-30',
    duration: 5,
    reason: 'Holiday break',
    status: 'pending',
    createdAt: new Date().toISOString(),
    conflicts: []
  },
  {
    id: 'test-request-3',
    userId: 'test-user-3',
    userName: 'Bob Johnson',
    userEmail: 'bob.johnson@stars.mc',
    company: 'Stars Monaco',
    type: 'sick',
    startDate: '2024-12-10',
    endDate: '2024-12-12',
    duration: 2,
    reason: 'Medical appointment',
    status: 'pending',
    createdAt: new Date().toISOString(),
    conflicts: []
  }
];

// Write test data to a JSON file
fs.writeFileSync('test-requests.json', JSON.stringify(testRequests, null, 2));

console.log('✅ Created test-requests.json with 3 test vacation requests');
console.log('\n📋 Test requests created:');
testRequests.forEach((req, index) => {
  console.log(`${index + 1}. ${req.userName} - ${req.type} - ${req.startDate} to ${req.endDate} (${req.duration} days)`);
});

console.log('\n🔧 To use these test requests:');
console.log('1. The API should return this data when called');
console.log('2. You should see 3 pending requests in the admin page');
console.log('3. You can then test the Approve/Reject buttons');
console.log('\n💡 Note: This creates mock data for testing purposes only');
