import { NextResponse } from 'next/server';

// Railway healthcheck endpoint
// Returns 200 immediately without any database or auth checks
export async function GET() {
  return NextResponse.json({ 
    status: 'ok',
    timestamp: new Date().toISOString()
  }, { status: 200 });
}
