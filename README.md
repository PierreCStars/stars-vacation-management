# Stars Vacation Management

A modern vacation management system built with Next.js, NextAuth.js, and Firebase.

## 🚀 Local Development

### Quick Start

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment:**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your local values
   ```

3. **Start development server:**
   ```bash
   # Option 1: Start and wait for health check (recommended)
   npm run dev:ready
   
   # Option 2: Start manually in separate terminals
   npm run dev          # Terminal 1: Start Next.js
   npm run wait:health  # Terminal 2: Wait for ready
   ```

4. **Access the app:**
   - Main app: http://localhost:3000
   - Health check: http://localhost:3000/api/health
   - Dashboard: http://localhost:3000/dashboard

### Development Scripts

- `npm run dev` - Start Next.js on port 3000
- `npm run dev:ready` - Start with automatic health check
- `npm run wait:health` - Wait for server to be ready
- `npm run kill:3000` - Safely kill processes on port 3000

### Troubleshooting

If the dev server won't start:
1. Check if port 3000 is in use: `npm run kill:3000`
2. Verify environment variables in `.env.local`
3. Clear Next.js cache: `rm -rf .next`

## 🔧 Environment Variables

Required for local development:
- `NEXTAUTH_URL=http://localhost:3000`
- `NEXTAUTH_SECRET=your-secret-key`
- `GOOGLE_ID=your-google-client-id`
- `GOOGLE_SECRET=your-google-client-secret`

## 📚 Tech Stack

- **Frontend:** Next.js 14, React 18, Tailwind CSS
- **Authentication:** NextAuth.js with Google OAuth
- **Backend:** Firebase Firestore, Google Calendar API
- **Styling:** Tailwind CSS with custom design system

## 🚀 Deployment

- **Hosting:** Vercel
- **Database:** Firebase Firestore
- **Authentication:** NextAuth.js with Google OAuth
