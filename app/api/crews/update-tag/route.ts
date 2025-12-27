import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { updateCrewTag } from '@/lib/crews';
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

    const { crewId, tag, tagColor } = await request.json();

    if (!crewId || typeof crewId !== 'number') {
      return NextResponse.json({ error: 'Crew ID is required' }, { status: 400 });
    }

    if (tagColor === undefined || typeof tagColor !== 'string') {
      return NextResponse.json({ error: 'Tag color is required' }, { status: 400 });
    }

    const result = updateCrewTag(decoded.userId, crewId, tag || null, tagColor);

    if (!result.success) {
      return NextResponse.json({ error: result.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, message: result.message });
  } catch (error) {
    console.error('Update crew tag error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

