// Detailed test to examine the actual data structure in vacationRequests collection
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { db } from './firebase-config.js';

async function examineVacationRequestsData() {
  console.log('🔍 Examining vacationRequests collection data structure...');
  
  try {
    const vacationRequestsRef = collection(db, 'vacationRequests');
    const q = query(vacationRequestsRef, limit(3)); // Get first 3 documents
    const snapshot = await getDocs(q);
    
    console.log(`📊 Found ${snapshot.size} documents in vacationRequests collection`);
    
    if (snapshot.size > 0) {
      console.log('\n📋 Document structure analysis:');
      snapshot.forEach((doc, index) => {
        console.log(`\n--- Document ${index + 1} (ID: ${doc.id}) ---`);
        const data = doc.data();
        
        // List all available fields
        const fields = Object.keys(data);
        console.log('Available fields:', fields);
        
        // Show field values
        fields.forEach(field => {
          const value = data[field];
          const type = typeof value;
          console.log(`  ${field}: ${type} = ${JSON.stringify(value)}`);
        });
        
        // Check for timestamp fields
        const timestampFields = fields.filter(field => 
          data[field] && 
          typeof data[field] === 'object' && 
          data[field].seconds !== undefined
        );
        if (timestampFields.length > 0) {
          console.log('Timestamp fields found:', timestampFields);
          timestampFields.forEach(field => {
            const timestamp = data[field];
            const date = new Date(timestamp.seconds * 1000);
            console.log(`  ${field} as Date: ${date.toISOString()}`);
          });
        }
      });
      
      console.log('\n✅ Data structure analysis complete');
      console.log('💡 Use this information to update the component to match your data structure');
      
    } else {
      console.log('⚠️  No documents found in vacationRequests collection');
    }
    
  } catch (error) {
    console.error('❌ Error examining data:', error);
  }
}

// Run the detailed test
examineVacationRequestsData().then(() => {
  console.log('\n✅ Detailed Firestore test completed');
}).catch((error) => {
  console.error('❌ Test failed:', error);
});
