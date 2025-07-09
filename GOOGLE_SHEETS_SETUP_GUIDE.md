# Google Sheets Setup Guide - Fix Vacation Management App

## Current Issues
1. ❌ `GOOGLE_SHEET_ID` environment variable is missing
2. ❌ `GOOGLE_SERVICE_ACCOUNT_KEY` is not properly configured
3. ❌ "VacationRequests" sheet doesn't exist in your Google Sheet
4. ❌ Google Sheets API errors: "Unable to parse range: VacationRequests!A1"

## Step-by-Step Fix

### Step 1: Create a Google Sheet
1. Go to [Google Sheets](https://sheets.google.com)
2. Create a new spreadsheet
3. Name it "Vacation Management" or similar
4. Copy the Sheet ID from the URL:
   - URL format: `https://docs.google.com/spreadsheets/d/YOUR_SHEET_ID_HERE/edit`
   - Copy the part between `/d/` and `/edit`

### Step 2: Create the VacationRequests Sheet
1. In your Google Sheet, click the "+" button at the bottom to add a new sheet
2. Rename the new sheet to exactly: `VacationRequests` (case sensitive)
3. Add these headers in row 1 (A1:N1):
   ```
   id | userId | userName | startDate | endDate | reason | company | type | status | createdAt | reviewedBy | reviewerEmail | reviewedAt | adminComment
   ```

### Step 3: Set Up Google Cloud Project
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable these APIs:
   - Google Sheets API
   - Gmail API
4. Create a Service Account:
   - Go to "IAM & Admin" > "Service Accounts"
   - Click "Create Service Account"
   - Name it "vacation-management-app"
   - Click "Create and Continue"
   - Skip role assignment for now
   - Click "Done"

### Step 4: Generate Service Account Key
1. Click on your service account
2. Go to "Keys" tab
3. Click "Add Key" > "Create new key"
4. Choose "JSON" format
5. Download the JSON file
6. **IMPORTANT**: The JSON should look like this:
   ```json
   {
     "type": "service_account",
     "project_id": "your-project-id",
     "private_key_id": "...",
     "private_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n",
     "client_email": "vacation-management-app@your-project-id.iam.gserviceaccount.com",
     "client_id": "...",
     "auth_uri": "https://accounts.google.com/o/oauth2/auth",
     "token_uri": "https://oauth2.googleapis.com/token",
     "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
     "client_x509_cert_url": "..."
   }
   ```

### Step 5: Share Google Sheet with Service Account
1. Open your Google Sheet
2. Click "Share" button
3. Add your service account email (from `client_email` in the JSON)
4. Give it "Editor" permissions
5. Click "Send" (no need to send notification)

### Step 6: Update Environment Variables
Add these to your `.env` file:

```env
# Google Sheets Configuration
GOOGLE_SHEET_ID=your_sheet_id_here
GOOGLE_SERVICE_ACCOUNT_KEY={"type":"service_account","project_id":"your-project-id","private_key_id":"...","private_key":"-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n","client_email":"vacation-management-app@your-project-id.iam.gserviceaccount.com","client_id":"...","auth_uri":"https://accounts.google.com/o/oauth2/auth","token_uri":"https://oauth2.googleapis.com/token","auth_provider_x509_cert_url":"https://www.googleapis.com/oauth2/v1/certs","client_x509_cert_url":"..."}
```

**IMPORTANT**: The `GOOGLE_SERVICE_ACCOUNT_KEY` must be the entire JSON as a single line with escaped quotes.

### Step 7: Test the Setup
1. Restart your development server: `npm run dev`
2. Submit a new vacation request
3. Check the console logs for:
   - ✅ "Google Sheets API initialized successfully"
   - ✅ "Service account key parsed successfully"
   - ✅ No "Unable to parse range" errors

### Troubleshooting

#### If you get "Unable to parse range" error:
- Make sure the sheet is named exactly `VacationRequests` (case sensitive)
- Make sure the service account has Editor access to the sheet

#### If you get JSON parsing errors:
- Make sure the `GOOGLE_SERVICE_ACCOUNT_KEY` is properly formatted
- The entire JSON should be on one line with escaped quotes
- Use this command to format it properly:
  ```bash
  cat your-service-account-key.json | tr -d '\n' | sed 's/"/\\"/g'
  ```

#### If you get "unauthorized_client" errors:
- Make sure the service account email has access to the Google Sheet
- Make sure the Google Sheets API is enabled in your Google Cloud project

### Quick Test Script
Run this to test your configuration:

```bash
node -e "
const key = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
const sheetId = process.env.GOOGLE_SHEET_ID;
console.log('Sheet ID exists:', !!sheetId);
console.log('Service account key exists:', !!key);
if (key) {
  try {
    const parsed = JSON.parse(key);
    console.log('Key parsed successfully');
    console.log('Client email:', parsed.client_email);
  } catch (e) {
    console.log('Key parsing failed:', e.message);
  }
}
"
```

## Expected Results
After following these steps:
- ✅ Vacation requests will be stored in Google Sheets
- ✅ The "VacationRequests" sheet will be created automatically if missing
- ✅ Data will persist across server restarts
- ✅ Admin can view and manage requests in Google Sheets directly 