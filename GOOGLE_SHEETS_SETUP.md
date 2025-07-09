# Google Sheets Database Setup

This guide will help you set up Google Sheets as your database for the vacation management app.

## Step 1: Create a Google Sheet

1. Go to [Google Sheets](https://sheets.google.com)
2. Create a new spreadsheet
3. Name the first sheet "VacationRequests" (or keep the default name)
4. Copy the spreadsheet ID from the URL (it's the long string between `/d/` and `/edit`)

## Step 2: Set up Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select an existing one
3. Enable the Google Sheets API:
   - Go to "APIs & Services" > "Library"
   - Search for "Google Sheets API"
   - Click on it and press "Enable"

## Step 3: Create Service Account

1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "Service Account"
3. Fill in the service account details:
   - Name: "vacation-app-service-account"
   - Description: "Service account for vacation management app"
4. Click "Create and Continue"
5. Skip the optional steps and click "Done"

## Step 4: Generate Service Account Key

1. Click on the service account you just created
2. Go to the "Keys" tab
3. Click "Add Key" > "Create new key"
4. Choose "JSON" format
5. Download the JSON file

## Step 5: Share the Google Sheet

1. Open your Google Sheet
2. Click "Share" in the top right
3. Add the service account email (found in the JSON file under `client_email`)
4. Give it "Editor" permissions
5. Click "Send"

## Step 6: Configure Environment Variables

Create a `.env.local` file in your project root with the following variables:

```env
# Google Sheets Configuration
GOOGLE_SHEET_ID=your_google_sheet_id_here
GOOGLE_SERVICE_ACCOUNT_KEY={"type":"service_account","project_id":"your_project_id","private_key_id":"your_private_key_id","private_ke±y":"-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY_HERE\n-----END PRIVATE KEY-----\n","client_email":"your_service_account_email@your_project.iam.gserviceaccount.com","client_id":"your_client_id","auth_uri":"https://accounts.google.com/o/oauth2/auth","token_uri":"https://oauth2.googleapis.com/token","auth_provider_x509_cert_url":"https://www.googleapis.com/oauth2/v1/certs","client_x509_cert_url":"https://www.googleapis.com/robot/v1/metadata/x509/your_service_account_email%40your_project.iam.gserviceaccount.com"}

# Email Configuration (Resend)
RESEND_API_KEY=your_resend_api_key_here

# App Configuration
NEXTAUTH_SECRET=your_nextauth_secret_here
NEXTAUTH_URL=http://localhost:3000

# Google OAuth (for NextAuth)
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here
```

Replace the values with your actual credentials:
- `GOOGLE_SHEET_ID`: The ID from your Google Sheet URL
- `GOOGLE_SERVICE_ACCOUNT_KEY`: The entire JSON content from the downloaded service account key file

## Step 7: Test the Setup

1. Restart your development server
2. Try submitting a vacation request
3. Check your Google Sheet to see if the data appears

## Troubleshooting

### Common Issues:

1. **"GOOGLE_SHEET_ID environment variable is not set"**
   - Make sure you've added the `GOOGLE_SHEET_ID` to your `.env.local` file

2. **"Invalid credentials"**
   - Ensure the service account JSON is properly formatted in the environment variable
   - Check that the service account email has access to the Google Sheet

3. **"Permission denied"**
   - Make sure you've shared the Google Sheet with the service account email
   - Verify the service account has "Editor" permissions

4. **"Sheet not found"**
   - Ensure the sheet name is "VacationRequests" (case-sensitive)
   - Check that the Google Sheet ID is correct

### Security Notes:

- Never commit your `.env.local` file to version control
- Keep your service account key secure
- Consider using environment variables in production deployments 