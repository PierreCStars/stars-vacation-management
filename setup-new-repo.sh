#!/bin/bash

# Stars Vacation Management - Fresh Repository Setup Script
# This script helps create a clean version of the app in a new repository

echo "🚀 Setting up fresh Stars Vacation Management repository..."

# Step 1: Create a temporary directory for the fresh codebase
FRESH_DIR="../stars-vacation-management-fresh"
echo "📁 Creating fresh directory: $FRESH_DIR"
mkdir -p "$FRESH_DIR"

# Step 2: Copy all source files (excluding git history and build artifacts)
echo "📋 Copying source files..."
cp -r src/ "$FRESH_DIR/"
cp -r public/ "$FRESH_DIR/"
cp package.json "$FRESH_DIR/"
cp package-lock.json "$FRESH_DIR/"
cp next.config.mjs "$FRESH_DIR/"
cp tsconfig.json "$FRESH_DIR/"
cp tailwind.config.js "$FRESH_DIR/"
cp postcss.config.mjs "$FRESH_DIR/"
cp middleware.ts "$FRESH_DIR/"
cp next-env.d.ts "$FRESH_DIR/"
cp .eslintrc.cjs "$FRESH_DIR/"
cp firestore.rules "$FRESH_DIR/"
cp firestore.indexes.json "$FRESH_DIR/"
cp vercel.json "$FRESH_DIR/"

# Step 3: Create a fresh README
echo "📝 Creating fresh README..."
cat > "$FRESH_DIR/README.md" << 'EOF'
# Stars Vacation Management System v2

A comprehensive vacation request management system with Google Calendar integration, built with Next.js, TypeScript, and Firebase.

## Features

- **Vacation Request Management**: Submit, approve, and track vacation requests
- **Google Calendar Integration**: Sync with company calendar and detect conflicts
- **Multi-language Support**: English, French, and Italian
- **Admin Dashboard**: Comprehensive analytics and management tools
- **Email Notifications**: Automated email alerts for requests and approvals
- **Responsive Design**: Works on desktop and mobile devices

## Tech Stack

- **Frontend**: Next.js 15, React, TypeScript, Tailwind CSS
- **Authentication**: NextAuth.js with Google OAuth
- **Database**: Firebase Firestore
- **Calendar**: Google Calendar API
- **Email**: Custom SMTP service
- **Deployment**: Vercel

## Getting Started

1. Clone the repository
2. Install dependencies: `npm install`
3. Set up environment variables (see `.env.example`)
4. Run development server: `npm run dev`

## Environment Variables

Copy `.env.example` to `.env.local` and configure:

```bash
# Authentication
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-here

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Firebase
FIREBASE_PROJECT_ID=your-firebase-project-id
FIREBASE_PRIVATE_KEY=your-firebase-private-key
FIREBASE_CLIENT_EMAIL=your-firebase-client-email

# Google Calendar
GOOGLE_CALENDAR_ID=your-calendar-id
GOOGLE_SERVICE_ACCOUNT_KEY=your-service-account-key

# Email
SMTP_HOST=your-smtp-host
SMTP_PORT=587
SMTP_USER=your-smtp-user
SMTP_PASS=your-smtp-password
```

## Deployment

This project is configured for deployment on Vercel. Set up the environment variables in your Vercel project settings.

## License

Private - Stars Luxury Group
EOF

# Step 4: Create a fresh .gitignore
echo "🚫 Creating fresh .gitignore..."
cat > "$FRESH_DIR/.gitignore" << 'EOF'
# Dependencies
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Next.js
.next/
out/
build/
dist/

# Environment variables
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# Vercel
.vercel/

# TypeScript
*.tsbuildinfo
next-env.d.ts

# IDE
.vscode/
.idea/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db

# Logs
*.log
logs/

# Runtime data
pids
*.pid
*.seed
*.pid.lock

# Coverage directory used by tools like istanbul
coverage/

# Firebase
.firebase/
firebase-debug.log
firebase-debug.*.log

# Temporary files
*.tmp
*.temp
EOF

# Step 5: Create a fresh .env.example
echo "🔧 Creating fresh .env.example..."
cat > "$FRESH_DIR/.env.example" << 'EOF'
# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-nextauth-secret-here

# Google OAuth (for authentication)
GOOGLE_CLIENT_ID=your-google-oauth-client-id
GOOGLE_CLIENT_SECRET=your-google-oauth-client-secret

# Firebase Configuration
FIREBASE_PROJECT_ID=your-firebase-project-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour Firebase Private Key Here\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=your-firebase-service-account@your-project.iam.gserviceaccount.com

# Google Calendar API
GOOGLE_CALENDAR_ID=your-company-calendar-id@group.calendar.google.com
GOOGLE_SERVICE_ACCOUNT_KEY={"type":"service_account","project_id":"your-project-id","private_key_id":"key-id","private_key":"-----BEGIN PRIVATE KEY-----\nYour Service Account Private Key\n-----END PRIVATE KEY-----\n","client_email":"your-service-account@your-project.iam.gserviceaccount.com","client_id":"client-id","auth_uri":"https://accounts.google.com/o/oauth2/auth","token_uri":"https://oauth2.googleapis.com/token","auth_provider_x509_cert_url":"https://www.googleapis.com/oauth2/v1/certs","client_x509_cert_url":"https://www.googleapis.com/robot/v1/metadata/x509/your-service-account%40your-project.iam.gserviceaccount.com"}

# Email Configuration (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Admin Email Addresses
ADMIN_EMAILS=pierre@stars.mc,johnny@stars.mc,daniel@stars.mc,compta@stars.mc

# Application Settings
NEXT_PUBLIC_APP_NAME="Stars Vacation Management"
NEXT_PUBLIC_APP_URL=http://localhost:3000
EOF

# Step 6: Update package.json with fresh metadata
echo "📦 Updating package.json..."
cat > "$FRESH_DIR/package.json" << 'EOF'
{
  "name": "stars-vacation-management-v2",
  "version": "2.0.0",
  "description": "Stars Vacation Management System - Fresh Version",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "type-check": "tsc --noEmit"
  },
  "dependencies": {
    "next": "15.5.0",
    "react": "^18",
    "react-dom": "^18",
    "next-auth": "^4.24.5",
    "next-intl": "^3.9.1",
    "firebase": "^10.7.1",
    "firebase-admin": "^12.0.0",
    "googleapis": "^128.0.0",
    "nodemailer": "^6.9.7",
    "date-fns": "^2.30.0",
    "lucide-react": "^0.294.0",
    "clsx": "^2.0.0",
    "tailwind-merge": "^2.0.0"
  },
  "devDependencies": {
    "typescript": "^5",
    "@types/node": "^20",
    "@types/react": "^18",
    "@types/react-dom": "^18",
    "@types/nodemailer": "^6.4.14",
    "autoprefixer": "^10.0.1",
    "postcss": "^8",
    "tailwindcss": "^3.3.0",
    "eslint": "^8",
    "eslint-config-next": "15.5.0"
  },
  "engines": {
    "node": ">=18.0.0"
  },
  "keywords": [
    "vacation",
    "management",
    "nextjs",
    "firebase",
    "google-calendar",
    "stars-luxury"
  ],
  "author": "Stars Luxury Group",
  "license": "UNLICENSED"
}
EOF

# Step 7: Create a setup instructions file
echo "📚 Creating setup instructions..."
cat > "$FRESH_DIR/SETUP.md" << 'EOF'
# Setup Instructions for Fresh Repository

## 1. GitHub Repository Setup

1. Create a new GitHub repository (e.g., `stars-vacation-management-v2`)
2. Make it private
3. Don't initialize with README, .gitignore, or license

## 2. Local Setup

1. Clone this fresh codebase to your new repository:
   ```bash
   cd stars-vacation-management-fresh
   git init
   git add .
   git commit -m "Initial commit - Fresh Stars Vacation Management System"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
   git push -u origin main
   ```

## 3. Environment Variables

1. Copy `.env.example` to `.env.local`
2. Configure all environment variables:
   - NextAuth configuration
   - Google OAuth credentials
   - Firebase project settings
   - Google Calendar API credentials
   - SMTP email settings

## 4. Vercel Deployment

1. Connect your new GitHub repository to Vercel
2. Create a new Vercel project
3. Configure all environment variables in Vercel dashboard
4. Deploy

## 5. Firebase Setup

1. Create a new Firebase project (or use existing)
2. Update Firebase configuration in environment variables
3. Set up Firestore security rules
4. Configure Google Calendar API access

## 6. Google Calendar Setup

1. Create a new Google Cloud project (or use existing)
2. Enable Google Calendar API
3. Create service account credentials
4. Share your company calendar with the service account

## 7. Testing

1. Test local development: `npm run dev`
2. Test authentication flow
3. Test vacation request submission
4. Test admin approval process
5. Test email notifications
6. Test calendar integration

## Important Notes

- This is a completely fresh repository with no connection to the old one
- All environment variables need to be reconfigured
- Firebase and Google Calendar settings need to be updated
- The app name and version have been updated to v2
- All deployment history and issues are separate from the original repo
EOF

echo "✅ Fresh repository setup complete!"
echo ""
echo "📁 Fresh codebase created in: $FRESH_DIR"
echo ""
echo "🚀 Next steps:"
echo "1. Create your new GitHub repository"
echo "2. Follow the instructions in $FRESH_DIR/SETUP.md"
echo "3. Configure environment variables"
echo "4. Deploy to Vercel"
echo ""
echo "📚 See $FRESH_DIR/SETUP.md for detailed instructions"
