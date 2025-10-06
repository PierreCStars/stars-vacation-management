'use server';

import { revalidateTag } from 'next/cache';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { syncEventForRequest } from '@/lib/calendar/sync';
import { VacationStatusEnum, normalizeVacationStatus } from '@/types/vacation-status';

interface ValidateRequestActionInput {
  id: string;
  action: 'approve' | 'deny';
}

export async function validateRequestAction(formData: FormData) {
  console.log('[ADMIN_VALIDATE] start', { formData: Object.fromEntries(formData.entries()) });
  
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      console.error('[ADMIN_VALIDATE] error', { error: 'No session' });
      throw new Error('Unauthorized');
    }

    const id = formData.get('id') as string;
    const action = formData.get('action') as 'approve' | 'deny';
    
    if (!id || !action) {
      console.error('[ADMIN_VALIDATE] error', { error: 'Missing id or action' });
      throw new Error('Missing required fields');
    }

    const status = action === 'approve' ? 'approved' : 'rejected';
    const normalizedStatus = normalizeVacationStatus(status);
    
    console.log('[ADMIN_VALIDATE] processing', { id, action, status: normalizedStatus });

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
      status: normalizedStatus,
      reviewedBy: reviewer.name,
      reviewerEmail: reviewer.email,
      reviewedAt: new Date()
    });

    console.log('[ADMIN_VALIDATE] firestore updated', { id, status: normalizedStatus });

    // Sync with calendar
    try {
      await syncEventForRequest(id, normalizedStatus);
      console.log('[ADMIN_VALIDATE] calendar synced', { id, status: normalizedStatus });
    } catch (calendarError) {
      console.warn('[ADMIN_VALIDATE] calendar sync failed', { id, error: calendarError });
      // Don't fail the whole operation if calendar sync fails
    }

    // Revalidate cache tags
    revalidateTag('vacationRequests:list');
    revalidateTag('calendar:all');
    
    console.log('[ADMIN_VALIDATE] success', { id, status: normalizedStatus });
    
    return { success: true, id, status: normalizedStatus };
  } catch (error) {
    console.error('[ADMIN_VALIDATE] error', { 
      error: error instanceof Error ? error.message : String(error),
      formData: Object.fromEntries(formData.entries())
    });
    throw error;
  }
}
