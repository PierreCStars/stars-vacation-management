import { NextResponse } from 'next/server';

export async function GET() {
  if (process.env.E2E_USE_FAKE !== '1') return NextResponse.json({ ok: false }, { status: 404 });
  // Set a session cookie the same way NextAuth would (or expose a dev-only login flow)
  // For simplicity, return a JSON 'token' the test can store in localStorage and your app reads.
  return NextResponse.json({ ok: true, email: 'tester@stars.mc' });
}






