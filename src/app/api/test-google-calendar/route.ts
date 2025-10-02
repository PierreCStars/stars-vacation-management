import { NextResponse } from 'next/server';
import { addVacationToCalendar, CAL_TARGET, CAL_SOURCE } from '@/lib/google-calendar';
import { google } from 'googleapis';

export const dynamic = "force-dynamic";
export const runtime = 'nodejs';
export const revalidate = 0;

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const action = url.searchParams.get('action') || 'test';
    
    console.log('📅 Testing Google Calendar integration...');
    console.log('🎯 Action:', action);
    
    // Check environment variables
    const envCheck = {
      GOOGLE_CALENDAR_SERVICE_ACCOUNT_KEY_BASE64: process.env.GOOGLE_CALENDAR_SERVICE_ACCOUNT_KEY_BASE64 ? '✅ Present' : '❌ Missing',
      GOOGLE_CALENDAR_SERVICE_ACCOUNT_KEY: process.env.GOOGLE_CALENDAR_SERVICE_ACCOUNT_KEY ? '✅ Present' : '❌ Missing',
      GOOGLE_SERVICE_ACCOUNT_KEY: process.env.GOOGLE_SERVICE_ACCOUNT_KEY ? '✅ Present' : '❌ Missing',
      GOOGLE_CALENDAR_TARGET_ID: process.env.GOOGLE_CALENDAR_TARGET_ID || 'Not set',
      GOOGLE_CALENDAR_SOURCE_ID: process.env.GOOGLE_CALENDAR_SOURCE_ID || 'Not set',
      GOOGLE_CALENDAR_ID: process.env.GOOGLE_CALENDAR_ID || 'Not set',
      CAL_TARGET: CAL_TARGET,
      CAL_SOURCE: CAL_SOURCE || 'Not set'
    };
    
    console.log('🔍 Environment check:', envCheck);
    
    if (!process.env.GOOGLE_CALENDAR_SERVICE_ACCOUNT_KEY_BASE64 && !process.env.GOOGLE_CALENDAR_SERVICE_ACCOUNT_KEY && !process.env.GOOGLE_SERVICE_ACCOUNT_KEY) {
      return NextResponse.json({
        success: false,
        error: 'Google Calendar service account key not configured (need GOOGLE_CALENDAR_SERVICE_ACCOUNT_KEY_BASE64, GOOGLE_CALENDAR_SERVICE_ACCOUNT_KEY, or GOOGLE_SERVICE_ACCOUNT_KEY)',
        envCheck
      }, { status: 400 });
    }
    
    // Test Google Calendar API initialization
    try {
      // Use the same credential loading logic as the main library
      let credentials;
      
      // Try base64 encoded key first
      const base64Key = process.env.GOOGLE_CALENDAR_SERVICE_ACCOUNT_KEY_BASE64;
      if (base64Key) {
        try {
          const decoded = Buffer.from(base64Key, 'base64').toString('utf-8');
          credentials = JSON.parse(decoded);
          // Normalize private key newlines
          credentials.private_key = String(credentials.private_key).replace(/\\n/g, "\n");
        } catch (error) {
          throw new Error(`Failed to decode base64 key: ${error instanceof Error ? error.message : String(error)}`);
        }
      } else {
        // Fallback to regular key
        const raw = process.env.GOOGLE_CALENDAR_SERVICE_ACCOUNT_KEY || process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
        if (!raw) throw new Error('No service account key found');
        
        if (raw.trim().startsWith("{")) {
          credentials = JSON.parse(raw);
          credentials.private_key = String(credentials.private_key).replace(/\\n/g, "\n");
        } else {
          throw new Error('Service account key must be JSON format');
        }
      }

      const auth = new google.auth.GoogleAuth({
        credentials,
        scopes: ['https://www.googleapis.com/auth/calendar'],
      });
      
      const calendar = google.calendar({ version: 'v3', auth });
      console.log('✅ Google Calendar API initialized successfully');
      
      // Test calendar access
      try {
        const calendarList = await calendar.calendarList.list();
        console.log('✅ Calendar list accessed successfully');
        console.log('📅 Available calendars:', calendarList.data.items?.length || 0);
        
        // Test target calendar access
        if (CAL_TARGET && CAL_TARGET !== 'primary') {
          try {
            const targetCalendar = await calendar.calendars.get({ calendarId: CAL_TARGET });
            console.log('✅ Target calendar accessed:', targetCalendar.data.summary);
          } catch (targetError) {
            console.warn('⚠️ Target calendar access failed:', targetError instanceof Error ? targetError.message : String(targetError));
          }
        }
        
        // Test adding a vacation event (if action is 'create')
        if (action === 'create') {
          const testEvent = {
            summary: 'Test Vacation Event',
            description: 'This is a test vacation event created by the API',
            start: {
              dateTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
              timeZone: 'Europe/Paris',
            },
            end: {
              dateTime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(), // Day after tomorrow
              timeZone: 'Europe/Paris',
            },
            colorId: '1', // Red color
          };
          
          try {
            const response = await calendar.events.insert({
              calendarId: CAL_TARGET,
              requestBody: testEvent,
            });
            
            console.log('✅ Test event created successfully:', response.data.id);
            
            return NextResponse.json({
              success: true,
              message: 'Google Calendar integration test successful',
              envCheck,
              calendarAccess: {
                availableCalendars: calendarList.data.items?.length || 0,
                targetCalendar: CAL_TARGET,
                targetCalendarAccess: 'success'
              },
              testEvent: {
                created: true,
                eventId: response.data.id,
                summary: testEvent.summary,
                start: testEvent.start.dateTime,
                end: testEvent.end.dateTime
              }
            });
            
          } catch (createError) {
            console.error('❌ Failed to create test event:', createError);
            return NextResponse.json({
              success: false,
              error: 'Failed to create test event',
              envCheck,
              calendarAccess: {
                availableCalendars: calendarList.data.items?.length || 0,
                targetCalendar: CAL_TARGET,
                targetCalendarAccess: 'failed'
              },
              createError: createError instanceof Error ? createError.message : String(createError)
            }, { status: 500 });
          }
        }
        
        return NextResponse.json({
          success: true,
          message: 'Google Calendar integration test successful',
          envCheck,
          calendarAccess: {
            availableCalendars: calendarList.data.items?.length || 0,
            targetCalendar: CAL_TARGET,
            targetCalendarAccess: 'success'
          }
        });
        
      } catch (accessError) {
        console.error('❌ Calendar access failed:', accessError);
        return NextResponse.json({
          success: false,
          error: 'Failed to access Google Calendar',
          envCheck,
          accessError: accessError instanceof Error ? accessError.message : String(accessError)
        }, { status: 500 });
      }
      
    } catch (initError) {
      console.error('❌ Google Calendar API initialization failed:', initError);
      return NextResponse.json({
        success: false,
        error: 'Failed to initialize Google Calendar API',
        envCheck,
        initError: initError instanceof Error ? initError.message : String(initError)
      }, { status: 500 });
    }

  } catch (error) {
    console.error('❌ Google Calendar test failed:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
