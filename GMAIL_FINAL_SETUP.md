# Gmail API Final Setup Guide

## Current Issue
The Gmail API is configured but failing with "unauthorized_client" error. This means the domain-wide delegation is not properly set up.

## Solution: Complete Domain-Wide Delegation Setup

### Step 1: Get Your Service Account Client ID

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Navigate to "APIs & Services" > "Credentials"
3. Find your service account: `vacation-db@holiday-461710.iam.gserviceaccount.com`
4. Click on it and copy the **Client ID** (it looks like: `123456789012345678901`)

### Step 2: Set Up Domain-Wide Delegation in Google Workspace Admin

1. Go to [Google Workspace Admin Console](https://admin.google.com)
2. Navigate to "Security" > "Access and data control" > "API controls"
3. Click on "Manage Domain Wide Delegation"
4. Click "Add new"
5. In the "Client ID" field, paste your service account's Client ID
6. In the "OAuth Scopes" field, add these scopes:
   ```
   https://www.googleapis.com/auth/gmail.send,https://www.googleapis.com/auth/gmail.compose,https://www.googleapis.com/auth/spreadsheets
   ```
7. Click "Authorize"

### Step 3: Enable Gmail API

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Navigate to "APIs & Services" > "Library"
3. Search for "Gmail API"
4. Click on it and click "Enable"

### Step 4: Verify Service Account Permissions

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Navigate to "IAM & Admin" > "IAM"
3. Find your service account: `vacation-db@holiday-461710.iam.gserviceaccount.com`
4. Make sure it has these roles:
   - Gmail API Admin
   - Service Account Token Creator

### Step 5: Test the Configuration

After completing the above steps, restart your development server and test sending a vacation request. The emails should now be sent successfully.

## Alternative: Use Service Account Email Directly

If domain-wide delegation is too complex, you can also:

1. Use the service account email as the "from" address
2. Send emails from `vacation-db@holiday-461710.iam.gserviceaccount.com`
3. The recipients will see emails from this address

This approach doesn't require domain-wide delegation but emails will come from the service account email instead of your personal email. 