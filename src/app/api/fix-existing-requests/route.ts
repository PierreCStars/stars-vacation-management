import { NextResponse } from 'next/server';
import { getAllVacationRequests, updateVacationRequest } from '@/lib/firebase';

export async function GET() {
  try {
    console.log('🔧 Fixing existing vacation requests...');
    
    // Get all vacation requests
    const requests = await getAllVacationRequests();
    console.log(`📋 Found ${requests.length} vacation requests`);
    
    let fixedCount = 0;
    const results = [];
    
    for (const request of requests) {
      // Check if the request is missing userEmail
      if (!request.userEmail || request.userEmail === request.userId) {
        console.log(`🔧 Fixing request ${request.id}: ${request.userName}`);
        
        // Try to extract email from userId if it looks like an email
        let userEmail = request.userEmail;
        if (!userEmail || userEmail === request.userId) {
          if (request.userId.includes('@')) {
            userEmail = request.userId;
          } else {
            // For Google user IDs, we'll use a default email
            // In a real scenario, you might want to map user IDs to emails
            userEmail = 'pierre@stars.mc'; // Default for testing
          }
        }
        
        try {
          await updateVacationRequest(request.id!, { userEmail });
          console.log(`✅ Fixed request ${request.id}: ${userEmail}`);
          fixedCount++;
          results.push({
            id: request.id,
            userName: request.userName,
            oldEmail: request.userEmail,
            newEmail: userEmail,
            status: 'fixed'
          });
        } catch (error) {
          console.error(`❌ Failed to fix request ${request.id}:`, error);
          results.push({
            id: request.id,
            userName: request.userName,
            oldEmail: request.userEmail,
            newEmail: userEmail,
            status: 'failed',
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      } else {
        console.log(`✅ Request ${request.id} already has email: ${request.userEmail}`);
        results.push({
          id: request.id,
          userName: request.userName,
          email: request.userEmail,
          status: 'already_fixed'
        });
      }
    }
    
    console.log(`✅ Fixed ${fixedCount} out of ${requests.length} requests`);
    
    return NextResponse.json({
      success: true,
      message: `Fixed ${fixedCount} out of ${requests.length} vacation requests`,
      totalRequests: requests.length,
      fixedCount,
      results
    });
    
  } catch (error) {
    console.error('❌ Error fixing vacation requests:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Failed to fix vacation requests'
    }, { status: 500 });
  }
} 