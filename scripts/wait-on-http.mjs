#!/usr/bin/env node

import http from 'node:http';

const url = process.env.WAIT_ON_URL || 'http://localhost:3000/api/health';
const timeoutMs = Number(process.env.WAIT_ON_TIMEOUT_MS || 60000);
const intervalMs = Number(process.env.WAIT_ON_INTERVAL_MS || 1000);

function check() {
  return new Promise((resolve) => {
    const req = http.get(url, (res) => {
      resolve(res.statusCode && res.statusCode >= 200 && res.statusCode < 300);
    });
    req.on('error', () => resolve(false));
    req.setTimeout(2000, () => { 
      req.destroy(); 
      resolve(false); 
    });
  });
}

const start = Date.now();
(async () => {
  console.log(`Waiting for health check at ${url}...`);
  
  while (Date.now() - start < timeoutMs) {
    const ok = await check();
    if (ok) {
      console.log(`✅ Health check passed at ${url}`);
      process.exit(0);
    }
    process.stdout.write('.');
    await new Promise(r => setTimeout(r, intervalMs));
  }
  
  console.error(`\n❌ Health check timed out after ${timeoutMs}ms: ${url}`);
  process.exit(1);
})();

