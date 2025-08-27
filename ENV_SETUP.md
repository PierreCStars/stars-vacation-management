# Environment Variables Setup for Google Calendar Integration

## Required Environment Variables

Add these to your `.env` file:

```bash
# ========================================
# STARS VACATION MANAGEMENT - ENVIRONMENT
# ========================================

# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-nextauth-secret-here

# Google OAuth Configuration
GOOGLE_ID=your-google-oauth-client-id
GOOGLE_SECRET=your-google-oauth-client-secret

# Google Service Account for Calendar Integration
GOOGLE_SERVICE_ACCOUNT_KEY={"type":"service_account","project_id":"your-project-id","private_key_id":"...","private_key":"-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n","client_email":"your-service-account@your-project-id.iam.gserviceaccount.com","client_id":"...","auth_uri":"https://accounts.google.com/o/oauth2/auth","token_uri":"https://oauth2.googleapis.com/token","auth_provider_x509_cert_url":"https://www.googleapis.com/oauth2/v1/certs","client_x509_cert_url":"https://www.googleapis.com/robot/v1/metadata/x509/your-service-account%40your-project-id.iam.gserviceaccount.com"}

# Google Calendar ID for Vacation Events
GOOGLE_CALENDAR_ID=your-calendar-id-here

# Team Calendar ID (optional)
NEXT_PUBLIC_TEAM_CALENDAR_ID=team@stars.mc

# ========================================
# EMAIL CONFIGURATION
# ========================================

# SMTP Configuration for Email Notifications
GMAIL_USER=your-email@stars.mc
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@stars.mc
SMTP_FROM=your-email@stars.mc
SMTP_PASSWORD=your-app-password

# ========================================
# FIREBASE CONFIGURATION
# ========================================

NEXT_PUBLIC_FIREBASE_API_KEY=your-firebase-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id

# ========================================
# TIMEZONE CONFIGURATION
# ========================================

# Set timezone for calendar operations
TZ=Europe/Monaco
```

## Google OAuth Setup Instructions

1. **Go to Google Cloud Console**: https://console.cloud.google.com/
2. **Create or select a project**
3. **Enable Google Calendar API**:
   - Go to "APIs & Services" > "Library"
   - Search for "Google Calendar API"
   - Click "Enable"
4. **Create OAuth 2.0 credentials**:
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "OAuth 2.0 Client IDs"
   - Choose "Web application"
   - Add authorized redirect URIs:
     - `http://localhost:3000/api/auth/callback/google` (development)
     - `https://your-vercel-app.vercel.app/api/auth/callback/google` (production)
5. **Configure OAuth consent screen**:
   - Add scope: `https://www.googleapis.com/auth/calendar.readonly`
   - Add test users with @stars.mc emails

## Important Notes

- **Calendar Scope**: The new OAuth flow will request `calendar.readonly` access
- **User Consent**: Users will need to re-authenticate to grant calendar access
- **Service Account**: Still required for writing vacation events to calendar
- **Timezone**: All calendar operations use Europe/Monaco timezone
- **Security**: Never commit `.env` files to version control
