import { google } from 'googleapis';

// Google Sheets configuration
const SPREADSHEET_ID = process.env.GOOGLE_SHEET_ID;
const SHEET_NAME = 'VacationRequests';

// Initialize Google Sheets API
let auth: any = null;
let sheets: any = null;

try {
  if (process.env.GOOGLE_SERVICE_ACCOUNT_KEY && process.env.GOOGLE_SHEET_ID) {
    console.log('🔧 Initializing Google Sheets API...');
    
    // Parse the service account key
    let credentials;
    try {
      credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY);
    } catch (parseError) {
      const errorMessage = parseError instanceof Error ? parseError.message : 'Unknown parsing error';
      console.error('❌ Failed to parse GOOGLE_SERVICE_ACCOUNT_KEY:', errorMessage);
      console.log('💡 Make sure the key is properly formatted as a JSON string');
      throw parseError;
    }
    
    // Validate required fields
    if (!credentials.client_email) {
      throw new Error('Service account key missing client_email field');
    }
    if (!credentials.private_key) {
      throw new Error('Service account key missing private_key field');
    }
    
    console.log('✅ Service account key parsed successfully');
    console.log('📧 Client email:', credentials.client_email);
    
    auth = new google.auth.GoogleAuth({
      credentials,
      scopes: [
        'https://www.googleapis.com/auth/spreadsheets',
        'https://www.googleapis.com/auth/gmail.send'
      ],
    });
    sheets = google.sheets({ version: 'v4', auth });
    console.log('✅ Google Sheets API initialized successfully');
  } else {
    if (!process.env.GOOGLE_SERVICE_ACCOUNT_KEY) {
      console.log('⚠️  GOOGLE_SERVICE_ACCOUNT_KEY not found in environment variables');
    }
    if (!process.env.GOOGLE_SHEET_ID) {
      console.log('⚠️  GOOGLE_SHEET_ID not found in environment variables');
    }
  }
} catch (error) {
  console.error('❌ Failed to initialize Google Sheets API:', error);
  console.log('💡 Please check your service account key configuration');
}

// Ensure the sheet exists and has headers
async function ensureSheetExists() {
  try {
    // First, try to get the sheet info to see if it exists
    const spreadsheet = await sheets.spreadsheets.get({
      spreadsheetId: SPREADSHEET_ID,
    });
    
    const sheetExists = spreadsheet.data.sheets?.some(
      (sheet: any) => sheet.properties?.title === SHEET_NAME
    );
    
    if (!sheetExists) {
      console.log(`📝 Creating sheet "${SHEET_NAME}" in spreadsheet...`);
      
      // Create the sheet
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId: SPREADSHEET_ID,
        requestBody: {
          requests: [
            {
              addSheet: {
                properties: {
                  title: SHEET_NAME,
                },
              },
            },
          ],
        },
      });
      
      console.log(`✅ Sheet "${SHEET_NAME}" created successfully`);
    }
    
    // Now add headers if they don't exist
    try {
      const response = await sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: `${SHEET_NAME}!A1:Z1`,
      });
      
      const existingHeaders = response.data.values?.[0] || [];
      const requiredHeaders = [
        'id',
        'userId',
        'userName',
        'startDate',
        'endDate',
        'reason',
        'company',
        'type',
        'status',
        'createdAt',
        'reviewedBy',
        'reviewerEmail',
        'reviewedAt',
        'adminComment'
      ];
      
      // Check if headers are missing or different
      const headersMatch = requiredHeaders.every((header, index) => 
        existingHeaders[index] === header
      );
      
      if (!headersMatch) {
        console.log(`📝 Adding headers to sheet "${SHEET_NAME}"...`);
        
        await sheets.spreadsheets.values.update({
          spreadsheetId: SPREADSHEET_ID,
          range: `${SHEET_NAME}!A1`,
          valueInputOption: 'RAW',
          requestBody: {
            values: [requiredHeaders],
          },
        });
        
        console.log(`✅ Headers added to sheet "${SHEET_NAME}"`);
      }
    } catch (headerError) {
      console.log(`📝 Adding headers to sheet "${SHEET_NAME}"...`);
      
      await sheets.spreadsheets.values.update({
        spreadsheetId: SPREADSHEET_ID,
        range: `${SHEET_NAME}!A1`,
        valueInputOption: 'RAW',
        requestBody: {
          values: [[
            'id',
            'userId',
            'userName',
            'startDate',
            'endDate',
            'reason',
            'company',
            'type',
            'status',
            'createdAt',
            'reviewedBy',
            'reviewerEmail',
            'reviewedAt',
            'adminComment'
          ]],
        },
      });
      
      console.log(`✅ Headers added to sheet "${SHEET_NAME}"`);
    }
    
  } catch (error) {
    console.error('❌ Error ensuring sheet exists:', error);
    throw error;
  }
}

// Convert row data to vacation request object
function rowToVacationRequest(row: any[]): any {
  return {
    id: row[0] || '',
    userId: row[1] || '',
    userName: row[2] || '',
    startDate: row[3] || '',
    endDate: row[4] || '',
    reason: row[5] || '',
    company: row[6] || '',
    type: row[7] || '',
    status: row[8] || '',
    createdAt: row[9] || '',
    reviewedBy: row[10] || '',
    reviewerEmail: row[11] || '',
    reviewedAt: row[12] || '',
    adminComment: row[13] || '',
  };
}

// Convert vacation request object to row data
function vacationRequestToRow(request: any): any[] {
  return [
    request.id || '',
    request.userId || '',
    request.userName || '',
    request.startDate || '',
    request.endDate || '',
    request.reason || '',
    request.company || '',
    request.type || '',
    request.status || '',
    request.createdAt || '',
    request.reviewedBy || '',
    request.reviewerEmail || '',
    request.reviewedAt || '',
    request.adminComment || '',
  ];
}

// Load all vacation requests from Google Sheets
export async function loadVacationRequests(): Promise<any[]> {
  try {
    if (!SPREADSHEET_ID || !sheets) {
      console.warn('Google Sheets not configured, falling back to file system');
      // Fall back to file-based storage
      const { loadVacationRequests: loadFromFile } = await import('./vacation-requests');
      return await loadFromFile();
    }

    await ensureSheetExists();

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET_NAME}!A2:Z`, // Skip header row
    });

    const rows = response.data.values || [];
    return rows.map(rowToVacationRequest);
  } catch (error) {
    console.error('Error loading vacation requests from Google Sheets:', error);
    console.warn('Falling back to file system');
    // Fall back to file-based storage
    const { loadVacationRequests: loadFromFile } = await import('./vacation-requests');
    return await loadFromFile();
  }
}

// Save vacation requests to Google Sheets
export async function saveVacationRequests(requests: any[]) {
  try {
    if (!SPREADSHEET_ID || !sheets) {
      console.warn('Google Sheets not configured, falling back to file system');
      // Fall back to file-based storage
      const { saveVacationRequests: saveToFile } = await import('./vacation-requests');
      return await saveToFile(requests);
    }

    await ensureSheetExists();

    // Convert requests to rows
    const rows = requests.map(vacationRequestToRow);

    // Clear existing data (except headers)
    await sheets.spreadsheets.values.clear({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET_NAME}!A2:Z`,
    });

    // Write new data
    if (rows.length > 0) {
      await sheets.spreadsheets.values.update({
        spreadsheetId: SPREADSHEET_ID,
        range: `${SHEET_NAME}!A2`,
        valueInputOption: 'RAW',
        requestBody: {
          values: rows,
        },
      });
    }
  } catch (error) {
    console.error('Error saving vacation requests to Google Sheets:', error);
    console.warn('Falling back to file system');
    // Fall back to file-based storage
    const { saveVacationRequests: saveToFile } = await import('./vacation-requests');
    return await saveToFile(requests);
  }
}

// Add a single vacation request
export async function addVacationRequest(request: any) {
  try {
    if (!SPREADSHEET_ID || !sheets) {
      console.warn('Google Sheets not configured, falling back to file system');
      // Fall back to file-based storage
      const { loadVacationRequests: loadFromFile, saveVacationRequests: saveToFile } = await import('./vacation-requests');
      const requests = await loadFromFile();
      requests.push(request);
      return await saveToFile(requests);
    }

    await ensureSheetExists();

    const row = vacationRequestToRow(request);

    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET_NAME}!A:Z`,
      valueInputOption: 'RAW',
      requestBody: {
        values: [row],
      },
    });
  } catch (error) {
    console.error('Error adding vacation request to Google Sheets:', error);
    console.warn('Falling back to file system');
    // Fall back to file-based storage
    const { loadVacationRequests: loadFromFile, saveVacationRequests: saveToFile } = await import('./vacation-requests');
    const requests = await loadFromFile();
    requests.push(request);
    return await saveToFile(requests);
  }
}

// Update a single vacation request
export async function updateVacationRequest(id: string, updates: any) {
  try {
    if (!SPREADSHEET_ID || !sheets) {
      console.warn('Google Sheets not configured, falling back to file system');
      // Fall back to file-based storage
      const { updateVacationRequestStatus: updateInFile } = await import('./vacation-requests');
      return await updateInFile(id, updates.status, updates.adminComment, updates.reviewedBy, updates.reviewerEmail);
    }

    const requests = await loadVacationRequests();
    const requestIndex = requests.findIndex(req => req.id === id);
    
    if (requestIndex === -1) {
      return null;
    }

    // Update the request
    requests[requestIndex] = { ...requests[requestIndex], ...updates };
    
    // Save all requests back to the sheet
    await saveVacationRequests(requests);
    
    return requests[requestIndex];
  } catch (error) {
    console.error('Error updating vacation request in Google Sheets:', error);
    console.warn('Falling back to file system');
    // Fall back to file-based storage
    const { updateVacationRequestStatus: updateInFile } = await import('./vacation-requests');
    return await updateInFile(id, updates.status, updates.adminComment, updates.reviewedBy, updates.reviewerEmail);
  }
}

// Get all vacation requests (for admin pages)
export async function getAllVacationRequests() {
  return await loadVacationRequests();
}

// Update vacation request status
export async function updateVacationRequestStatus(
  id: string, 
  status: string, 
  comment?: string, 
  reviewerName?: string, 
  reviewerEmail?: string
) {
  const updates: any = { status };
  
  if (comment) {
    updates.adminComment = comment;
  }
  
  if (status === 'APPROVED' || status === 'REJECTED') {
    updates.reviewedBy = reviewerName || 'Unknown';
    updates.reviewerEmail = reviewerEmail || '';
    updates.reviewedAt = new Date().toISOString();
  }
  
  return await updateVacationRequest(id, updates);
} 