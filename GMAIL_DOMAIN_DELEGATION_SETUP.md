# Gmail API Domain-Wide Delegation Setup Guide

## Current Issue
The Gmail API is configured but failing with "Precondition check failed" error. This means the service account doesn't have permission to send emails on behalf of your domain.

## Solution: Set Up Domain-Wide Delegation

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
   https://www.googleapis.com/auth/gmail.send,https://www.googleapis.com/auth/gmail.compose,https://www.googleapis.com/auth/gmail.modify
   ```
7. Click "Authorize"

### Step 3: Update Gmail Service Configuration

The service account needs to use the correct user ID. Let me update the Gmail service: 