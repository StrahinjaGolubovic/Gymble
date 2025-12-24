import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { getUserCrew } from '@/lib/crews';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const crew = getUserCrew(decoded.userId);

    return NextResponse.json({ crew });
  } catch (error) {
    console.error('Get my crew error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

