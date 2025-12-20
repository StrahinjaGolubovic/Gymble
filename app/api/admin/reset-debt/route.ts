import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';

// Admin endpoint to reset all users' debt to 0
export async function POST(request: NextRequest) {
  try {
    // Reset all users' credits (debt) to 0
    db.prepare('UPDATE users SET credits = 0').run();

    return NextResponse.json({ 
      message: 'All user debt has been reset to 0',
      success: true 
    });
  } catch (error) {
    console.error('Reset debt error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

