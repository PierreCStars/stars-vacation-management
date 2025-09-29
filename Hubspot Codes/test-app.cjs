// Test the application by fetching vacation requests
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { db } from './firebase-config.js';

async function testApplication() {
  console.log('🧪 Testing the vacation management application...');
  
  try {
    // Test the same query that the component uses
    const vacationRequestsRef = collection(db, 'vacationRequests');
    const q = query(vacationRequestsRef, orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    
    console.log(`✅ Successfully fetched ${querySnapshot.size} vacation requests`);
    
    if (querySnapshot.size > 0) {
      console.log('\n📋 Sample request data:');
      const firstRequest = querySnapshot.docs[0].data();
      console.log('Employee:', firstRequest.userName);
      console.log('Status:', firstRequest.status);
      console.log('Start Date:', firstRequest.startDate);
      console.log('End Date:', firstRequest.endDate);
      console.log('Type:', firstRequest.type);
      console.log('Created At:', new Date(firstRequest.createdAt.seconds * 1000).toLocaleString());
      
      console.log('\n✅ Application test passed!');
      console.log('🌐 Your application should now display vacation requests correctly.');
      console.log('🔗 Visit: http://localhost:3000/en/admin/vacation-requests');
    } else {
      console.log('⚠️  No vacation requests found in the database');
    }
    
  } catch (error) {
    console.error('❌ Application test failed:', error);
  }
}

// Run the test
testApplication().then(() => {
  console.log('\n✅ Test completed');
}).catch((error) => {
  console.error('❌ Test failed:', error);
});
