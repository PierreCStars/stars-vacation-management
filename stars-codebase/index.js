const functions = require('firebase-functions');
const admin = require('firebase-admin');
const { parse } = require('url');
const path = require('path');

// Initialize Firebase Admin
admin.initializeApp();

// Initialize Next.js
const dev = process.env.NODE_ENV !== 'production';
const app = require('next')({ 
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
exports.nextjsServer = functions.https.onRequest(async (req, res) => {
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
exports.api = functions.https.onRequest((req, res) => {
  res.json({ message: 'API endpoint working!' });
});
