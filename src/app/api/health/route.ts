import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ 
    ok: true, 
    ts: Date.now(),
    status: 'healthy',
    uptime: process.uptime()
  }, { status: 200 });
}

