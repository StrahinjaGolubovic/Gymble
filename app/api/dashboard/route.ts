import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { getUserDashboard } from '@/lib/challenges';
import { cookies } from 'next/headers';
import db from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const userId = decoded.userId;
    const dashboard = getUserDashboard(userId);
    
    // Get user username and profile picture for admin check and display
    const user = db.prepare('SELECT username, profile_picture FROM users WHERE id = ?').get(userId) as { username: string; profile_picture: string | null } | undefined;
    
    return NextResponse.json({
      ...dashboard,
      username: user?.username,
      profilePicture: user?.profile_picture || null,
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

