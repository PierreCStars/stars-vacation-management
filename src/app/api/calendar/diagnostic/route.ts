import { NextResponse } from 'next/server';
import { getFirebaseAdmin } from '@/lib/firebaseAdmin';
import { syncEventForRequest } from '@/lib/calendar/sync';
import { CAL_TARGET } from '@/lib/google-calendar';
import { initializeCalendarClient } from '@/lib/google-calendar';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const revalidate = 0;

/**
 * Diagnostic endpoint to test Google Calendar sync functionality
 * GET: Check calendar connection and configuration
 * POST: Test syncing a specific vacation request
 */
export async function GET() {
  try {
    console.log('🔍 [DIAGNOSTIC] Starting calendar sync diagnostic...');
    
    const diagnostics: any = {
      timestamp: new Date().toISOString(),
      calendarConfig: {
        targetCalendarId: CAL_TARGET,
        envVars: {
          GOOGLE_CALENDAR_TARGET_ID: process.env.GOOGLE_CALENDAR_TARGET_ID ? '✅ Set' : '❌ Missing',
          GOOGLE_CALENDAR_SERVICE_ACCOUNT_KEY_BASE64: process.env.GOOGLE_CALENDAR_SERVICE_ACCOUNT_KEY_BASE64 ? '✅ Set' : '❌ Missing',
          GOOGLE_SERVICE_ACCOUNT_KEY: process.env.GOOGLE_SERVICE_ACCOUNT_KEY ? '✅ Set' : '❌ Missing',
        }
      },
      tests: {}
    };

    // Test 1: Firebase Admin
    try {
      const { db, error } = getFirebaseAdmin();
      if (db && !error) {
        diagnostics.tests.firebase = { status: '✅ Connected', error: null };
      } else {
        diagnostics.tests.firebase = { status: '❌ Failed', error: error || 'Unknown error' };
      }
    } catch (error) {
      diagnostics.tests.firebase = { 
        status: '❌ Exception', 
        error: error instanceof Error ? error.message : String(error) 
      };
    }

    // Test 2: Google Calendar Client Initialization
    try {
      const { auth, calendar } = initializeCalendarClient();
      const clientEmail = (auth as any).credentials?.client_email || 'unknown';
      const expectedServiceAccount = 'vacation-db@holiday-461710.iam.gserviceaccount.com';
      const serviceAccountMatch = clientEmail === expectedServiceAccount;
      
      diagnostics.tests.calendarClient = { 
        status: serviceAccountMatch ? '✅ Initialized' : '⚠️ Initialized (wrong service account)',
        clientEmail,
        expectedServiceAccount,
        serviceAccountMatch,
        scopes: ['https://www.googleapis.com/auth/calendar']
      };
    } catch (error) {
      diagnostics.tests.calendarClient = { 
        status: '❌ Failed', 
        error: error instanceof Error ? error.message : String(error) 
      };
    }

    // Test 3: Calendar Access and Permissions
    if (diagnostics.tests.calendarClient.status?.includes('Initialized')) {
      try {
        const { calendar } = initializeCalendarClient();
        const calendarList = await calendar.calendarList.list();
        const targetCalendar = calendarList.data.items?.find(
          cal => cal.id === CAL_TARGET
        );
        
        const expectedCalendarId = 'c_e98f5350bf743174f87e1a786038cb9d103c306b7246c6200684f81c37a6a764@group.calendar.google.com';
        const calendarIdMatch = CAL_TARGET === expectedCalendarId;
        
        // Check if accessRole indicates write permissions
        const hasWriteAccess = targetCalendar?.accessRole === 'writer' || 
                               targetCalendar?.accessRole === 'owner';
        
        diagnostics.tests.calendarAccess = {
          status: targetCalendar && hasWriteAccess ? '✅ Found with write access' : 
                  targetCalendar ? '⚠️ Found but no write access' : 
                  '❌ Not in list',
          availableCalendars: calendarList.data.items?.length || 0,
          targetCalendar: targetCalendar ? {
            id: targetCalendar.id,
            summary: targetCalendar.summary,
            accessRole: targetCalendar.accessRole,
            hasWriteAccess
          } : null,
          calendarIdMatch,
          expectedCalendarId,
          actualCalendarId: CAL_TARGET
        };
        
        // Test 4: Try to create a test event (write permission test)
        if (targetCalendar && hasWriteAccess) {
          try {
            const testEvent = {
              summary: '🧪 Test Event - Diagnostic Check',
              description: 'This is a test event to verify write permissions. It will be deleted immediately.',
              start: {
                date: new Date().toISOString().split('T')[0],
              },
              end: {
                date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0],
              },
            };
            
            const testResponse = await calendar.events.insert({
              calendarId: CAL_TARGET,
              requestBody: testEvent,
            });
            
            // Delete the test event immediately
            if (testResponse.data.id) {
              await calendar.events.delete({
                calendarId: CAL_TARGET,
                eventId: testResponse.data.id
              });
            }
            
            diagnostics.tests.writePermission = {
              status: '✅ Write permission verified',
              testEventCreated: true,
              testEventDeleted: true
            };
          } catch (writeError) {
            const writeErrorMessage = writeError instanceof Error ? writeError.message : String(writeError);
            const httpStatus = (writeError as any)?.response?.status;
            diagnostics.tests.writePermission = {
              status: '❌ Write permission test failed',
              error: writeErrorMessage,
              httpStatus,
              message: 'Service account cannot create events in the target calendar'
            };
          }
        } else {
          diagnostics.tests.writePermission = {
            status: '⚠️ Skipped - calendar not accessible or no write access',
            reason: !targetCalendar ? 'Calendar not in list' : 'No write access role'
          };
        }
      } catch (error) {
        diagnostics.tests.calendarAccess = { 
          status: '❌ Failed', 
          error: error instanceof Error ? error.message : String(error) 
        };
      }
    }

    // Test 5: Check for approved requests without calendar events
    try {
      const { db } = getFirebaseAdmin();
      if (db) {
        const snapshot = await db.collection('vacationRequests')
          .where('status', '==', 'approved')
          .limit(10)
          .get();
        
        const requests = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Array<{ id: string; calendarEventId?: string; googleCalendarEventId?: string; userName?: string; startDate?: string; endDate?: string; [key: string]: any }>;

        const withoutEvents = requests.filter(req => 
          !req.calendarEventId && !req.googleCalendarEventId
        );

        diagnostics.tests.approvedRequests = {
          status: '✅ Checked',
          totalApproved: requests.length,
          withoutCalendarEvents: withoutEvents.length,
          sample: withoutEvents.slice(0, 3).map(req => ({
            id: req.id,
            userName: req.userName || 'Unknown',
            startDate: req.startDate || 'N/A',
            endDate: req.endDate || 'N/A'
          }))
        };
      }
    } catch (error) {
      diagnostics.tests.approvedRequests = { 
        status: '❌ Failed', 
        error: error instanceof Error ? error.message : String(error) 
      };
    }

    const allTestsPassed = Object.values(diagnostics.tests).every(
      (test: any) => test.status?.startsWith('✅')
    );

    return NextResponse.json({
      success: allTestsPassed,
      diagnostics,
      summary: {
        allTestsPassed,
        totalTests: Object.keys(diagnostics.tests).length,
        passedTests: Object.values(diagnostics.tests).filter(
          (test: any) => test.status?.startsWith('✅')
        ).length
      }
    });

  } catch (error) {
    console.error('❌ [DIAGNOSTIC] Diagnostic failed:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { requestId } = body;

    if (!requestId) {
      return NextResponse.json({
        success: false,
        error: 'Missing requestId in request body'
      }, { status: 400 });
    }

    console.log('🧪 [DIAGNOSTIC] Testing sync for request:', requestId);

    const { db, error } = getFirebaseAdmin();
    if (!db || error) {
      return NextResponse.json({
        success: false,
        error: `Firebase Admin not available: ${error || 'unknown'}`
      }, { status: 500 });
    }

    const docRef = db.collection('vacationRequests').doc(requestId);
    const doc = await docRef.get();

    if (!doc.exists) {
      return NextResponse.json({
        success: false,
        error: `Vacation request ${requestId} not found`
      }, { status: 404 });
    }

    const requestData = doc.data()!;
    const calendarData = {
      id: requestId,
      userName: requestData.userName || 'Unknown',
      userEmail: requestData.userEmail || 'unknown@stars.mc',
      startDate: requestData.startDate || '',
      endDate: requestData.endDate || '',
      type: requestData.type || 'Full day',
      company: requestData.company || 'Unknown',
      reason: requestData.reason || '',
      status: requestData.status || 'pending'
    };

    console.log('🔄 [DIAGNOSTIC] Syncing request:', calendarData);

    const result = await syncEventForRequest(calendarData);

    return NextResponse.json({
      success: result.success,
      result,
      requestId,
      calendarData
    });

  } catch (error) {
    console.error('❌ [DIAGNOSTIC] Test sync failed:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}

