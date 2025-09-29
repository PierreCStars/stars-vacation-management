import functions from 'firebase-functions';
import admin from 'firebase-admin';
import { parse } from 'url';
import path from 'path';
import { fileURLToPath } from 'url';
import next from 'next';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Firebase Admin
admin.initializeApp();

// Initialize Next.js
const dev = process.env.NODE_ENV !== 'production';
const app = next({ 
  dev, 
  conf: { 
    distDir: path.join(__dirname, '../.next'),
    experimental: {
      serverComponentsExternalPackages: ['@google-cloud/firestore']
    }
  } 
});
const handle = app.getRequestHandler();

// Cloud Function for Next.js server-side rendering
export const nextjsServer = functions.https.onRequest(async (req, res) => {
  try {
    await app.prepare();
    const parsedUrl = parse(req.url, true);
    return handle(req, res, parsedUrl);
  } catch (error) {
    console.error('Error in Next.js Cloud Function:', error);
    res.status(500).send('Internal Server Error');
  }
});

// Optional: Add specific API functions if needed
export const api = functions.https.onRequest((req, res) => {
  res.json({ message: 'API endpoint working!' });
});
