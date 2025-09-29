// middleware.ts (root)
import { NextResponse } from 'next/server';

export const config = { matcher: [] }; // disables middleware on all routes

export function middleware() {
  return NextResponse.next();
}