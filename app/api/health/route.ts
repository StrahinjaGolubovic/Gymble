import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { existsSync } from 'fs';
import { join } from 'path';

// Enhanced health check endpoint
// Verifies critical system components
export async function GET() {
  const checks = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    database: false,
    filesystem: false,
  };

  // Check database connectivity
  try {
    db.prepare('SELECT 1').get();
    checks.database = true;
  } catch (error) {
    checks.status = 'degraded';
  }

  // Check filesystem access
  try {
    const dataDir = process.env.DATABASE_PATH 
      ? join(process.env.DATABASE_PATH, '..')
      : join(process.cwd(), 'data');
    checks.filesystem = existsSync(dataDir);
    if (!checks.filesystem) {
      checks.status = 'degraded';
    }
  } catch (error) {
    checks.status = 'degraded';
    checks.filesystem = false;
  }

  const httpStatus = checks.status === 'ok' ? 200 : 503;
  return NextResponse.json(checks, { status: httpStatus });
}
