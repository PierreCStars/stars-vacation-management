#!/bin/bash

# Stars Vacation Management - Fresh Repository Creation Script
echo "🚀 Creating fresh Stars Vacation Management repository..."

# Set the fresh directory
FRESH_DIR="../stars-vacation-management-fresh"

# Step 1: Copy essential source files
echo "📋 Copying essential source files..."
cp -r src/ "$FRESH_DIR/"
cp -r public/ "$FRESH_DIR/"

# Step 2: Copy configuration files
echo "⚙️ Copying configuration files..."
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

# Step 3: Update package.json for v2
echo "📦 Updating package.json for v2..."
sed -i '' 's/"name": "stars-vacation-management"/"name": "stars-vacation-management-v2"/' "$FRESH_DIR/package.json"
sed -i '' 's/"version": "0.1.0"/"version": "2.0.0"/' "$FRESH_DIR/package.json"
sed -i '' 's/"description": "A comprehensive vacation management system for Stars Luxury Group."/"description": "Stars Vacation Management System - Fresh Version"/' "$FRESH_DIR/package.json"

# Step 4: Create fresh README
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

Copy `.env.example` to `.env.local` and configure all required variables.

## Deployment

This project is configured for deployment on Vercel. Set up the environment variables in your Vercel project settings.

## License

Private - Stars Luxury Group
EOF

# Step 5: Create fresh .gitignore
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

# Firebase
.firebase/
firebase-debug.log
firebase-debug.*.log

# Temporary files
*.tmp
*.temp
EOF

# Step 6: Create fresh .env.example
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
NEXT_PUBLIC_APP_NAME="Stars Vacation Management v2"
NEXT_PUBLIC_APP_URL=http://localhost:3000
EOF

# Step 7: Create setup instructions
echo "📚 Creating setup instructions..."
cat > "$FRESH_DIR/SETUP.md" << 'EOF'
# 🚀 Fresh Repository Setup Guide

## Step 1: Create GitHub Repository

1. Go to [GitHub](https://github.com) and create a new repository
2. **Name**: `stars-vacation-management-v2` (or your preferred name)
3. **Description**: "Stars Vacation Management System - Fresh Version"
4. **Visibility**: Private (recommended)
5. **DO NOT** initialize with README, .gitignore, or license
6. Click "Create repository"

## Step 2: Initialize Local Repository

```bash
cd stars-vacation-management-fresh
git init
git add .
git commit -m "Initial commit - Fresh Stars Vacation Management System v2"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
git push -u origin main
```

## Step 3: Environment Variables Setup

1. Copy `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```

2. Configure all environment variables in `.env.local`:
   - **NextAuth**: URL and secret
   - **Google OAuth**: Client ID and secret for authentication
   - **Firebase**: Project ID, private key, and client email
   - **Google Calendar**: Calendar ID and service account key
   - **SMTP**: Email server settings
   - **Admin emails**: List of admin email addresses

## Step 4: Vercel Deployment

1. Go to [Vercel](https://vercel.com) and create a new project
2. Connect your new GitHub repository
3. Configure all environment variables in Vercel dashboard
4. Deploy the project

## Step 5: Firebase Setup

1. Create a new Firebase project (or use existing)
2. Update Firebase configuration in environment variables
3. Set up Firestore security rules
4. Configure Google Calendar API access

## Step 6: Google Calendar Setup

1. Create a new Google Cloud project (or use existing)
2. Enable Google Calendar API
3. Create service account credentials
4. Share your company calendar with the service account

## Step 7: Testing

1. Test local development: `npm run dev`
2. Test authentication flow
3. Test vacation request submission
4. Test admin approval process
5. Test email notifications
6. Test calendar integration

## Important Notes

✅ **Clean History**: This repository has no connection to the old one
✅ **Fresh Start**: All deployment history and issues are separate
✅ **Updated Version**: App name and version updated to v2
✅ **Isolated Environment**: All configurations are independent

## Troubleshooting

- If you encounter build errors, check that all environment variables are set
- Ensure Firebase and Google Calendar permissions are correct
- Verify that admin email addresses are properly configured
EOF

echo "✅ Fresh repository creation complete!"
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
