import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { requestToJoinCrew } from '@/lib/crews';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
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

    const { crewId } = await request.json();

    if (!crewId || typeof crewId !== 'number') {
      return NextResponse.json({ error: 'Crew ID is required' }, { status: 400 });
    }

    const result = requestToJoinCrew(decoded.userId, crewId);

    if (!result.success) {
      return NextResponse.json({ error: result.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, message: result.message });
  } catch (error) {
    console.error('Request to join crew error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

