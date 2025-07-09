# Gmail API and Google Sheets Fix Guide

## Current Issues:
1. **Gmail API**: `unauthorized_client` error
2. **Google Sheets**: `Unable to parse range: VacationRequests!A1` error

## Solution: Complete Setup

### Step 1: Fix Google Sheets Issue

The error shows that the "VacationRequests" sheet doesn't exist in your Google Sheet. You need to:

1. **Go to your Google Sheet**: https://docs.google.com/spreadsheets/d/1ER4gCtJbF8yGT4SY2iAX2HibdxLMpHVVR_wyIvVIMHk
2. **Create the "VacationRequests" sheet**:
   - Click the "+" button at the bottom to add a new sheet
   - Name it exactly: `VacationRequests` (case sensitive)
   - Add these headers in row 1:
     ```
     id | userId | userName | startDate | endDate | reason | company | type | status | createdAt | reviewedBy | reviewerEmail | reviewedAt | adminComment
     ```

### Step 2: Fix Gmail API Permissions

The service account needs proper Gmail API permissions:

1. **Go to Google Cloud Console**: https://console.cloud.google.com
2. **Navigate to "APIs & Services" > "Enabled APIs"**
3. **Click "+ ENABLE APIS AND SERVICES"**
4. **Search for "Gmail API" and enable it**
5. **Go to "APIs & Services" > "Credentials"**
6. **Find your service account**: `vacation-db@holiday-461710.iam.gserviceaccount.com`
7. **Click on it and go to "Keys" tab**
8. **Delete any existing keys**
9. **Click "Add Key" > "Create new key" > "JSON"**
10. **Download the new key file**

### Step 3: Update Your .env File

Replace your current `GOOGLE_SERVICE_ACCOUNT_KEY` with the new one:

1. **Open the downloaded JSON file**
2. **Copy the entire content**
3. **Open your `.env` file**
4. **Replace the `GOOGLE_SERVICE_ACCOUNT_KEY` value with the new JSON**

### Step 4: Alternative - Use Simple Email Service

If Gmail API continues to fail, we can use a simpler email service like Resend or Nodemailer.

## Quick Test

After making these changes:
1. Restart the development server
2. Submit a new vacation request
3. Check the console logs for success messages

## Expected Results

- ✅ Google Sheets should create a new row with your vacation request
- ✅ Email should be sent to johnny@stars.mc, daniel@stars.mc, and pierre@stars.mc
- ✅ Console should show success messages instead of errors 