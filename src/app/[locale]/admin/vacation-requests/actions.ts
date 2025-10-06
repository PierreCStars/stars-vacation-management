'use server';

import { revalidateTag } from 'next/cache';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { syncEventForRequest } from '@/lib/calendar/sync';
import { VACATION_STATUS, normalizeVacationStatus, type VacationStatus } from '@/types/vacation-status';

interface ValidateRequestActionInput {
  id: string;
  action: 'approve' | 'deny';
}

export async function validateRequestAction(formData: FormData) {
  const id = formData.get('id') as string;
  const action = formData.get('action') as 'approve' | 'deny';
  console.log('[ADMIN_VALIDATE] start', { id, action });
  
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      console.error('[ADMIN_VALIDATE] error', { error: 'No session' });
      throw new Error('Unauthorized');
    }

    if (!id || !action) {
      console.error('[ADMIN_VALIDATE] error', { error: 'Missing id or action' });
      throw new Error('Missing required fields');
    }

    const status: VacationStatus = 
      action === 'approve' ? VACATION_STATUS.APPROVED :
      action === 'deny'    ? VACATION_STATUS.DENIED :
                             VACATION_STATUS.PENDING;
    
    console.log('[ADMIN_VALIDATE] processing', { id, action, status });

    // Import Firebase Admin dynamically to avoid issues
    const { getFirebaseAdmin } = await import('@/lib/firebaseAdmin');
    const { db } = await getFirebaseAdmin();
    
    if (!db) {
      console.error('[ADMIN_VALIDATE] error', { error: 'Firebase not available' });
      throw new Error('Database not available');
    }

    const reviewer = {
      name: session.user.name || 'Admin',
      email: session.user.email
    };

    // Update the vacation request in Firestore
    const vacationRequestRef = db.collection('vacationRequests').doc(id);
    await vacationRequestRef.update({
      status: status,
      reviewedBy: reviewer.name,
      reviewerEmail: reviewer.email,
      reviewedAt: new Date()
    });

    console.log('[ADMIN_VALIDATE] firestore updated', { id, status });

    // Sync with calendar
    try {
      // Get the updated request data for calendar sync
      const updatedRequest = await vacationRequestRef.get();
      if (updatedRequest.exists) {
        const requestData = updatedRequest.data()!;
        const calendarData = {
          id: requestData.id || id,
          userName: requestData.userName || 'Unknown',
          userEmail: requestData.userEmail || 'unknown@example.com',
          startDate: requestData.startDate || '',
          endDate: requestData.endDate || '',
          type: requestData.type || 'Full day',
          company: requestData.company || 'Unknown',
          reason: requestData.reason || '',
          status: status
        };
        await syncEventForRequest(calendarData);
        console.log('[ADMIN_VALIDATE] calendar synced', { id, status });
      }
    } catch (calendarError) {
      console.warn('[ADMIN_VALIDATE] calendar sync failed', { id, error: calendarError });
      // Don't fail the whole operation if calendar sync fails
    }

    // Revalidate cache tags
    console.log('[CACHE] revalidate', { tags: ['vacationRequests:list', 'calendar:all'] });
    revalidateTag('vacationRequests:list');
    revalidateTag('calendar:all');
    
    console.log('[ADMIN_VALIDATE] success', { id, status });
    
    return;
  } catch (error) {
    console.error('[ADMIN_VALIDATE] error', { 
      error: error instanceof Error ? error.message : String(error),
      id,
      action
    });
    throw error;
  }
}
