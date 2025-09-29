import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ requestId: string }> }
) {
  if (process.env.E2E_USE_FAKE !== '1') return NextResponse.json({}, { status: 404 });
  
  const { requestId } = await params;
  
  // TODO: Query your actual embedded calendar store/DB
  // For now, return a mock response
  return NextResponse.json({ 
    exists: true, // Mock: assume it exists for testing
    requestId
  });
}
