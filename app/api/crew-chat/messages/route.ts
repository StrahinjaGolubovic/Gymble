import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { getCrewChatMessages } from '@/lib/crew-chat';
import { getUserCrew } from '@/lib/crews';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
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
    const { searchParams } = new URL(request.url);
    const crewIdParam = searchParams.get('crew_id');

    if (!crewIdParam) {
      return NextResponse.json({ error: 'crew_id is required' }, { status: 400 });
    }

    const crewId = parseInt(crewIdParam, 10);
    if (isNaN(crewId)) {
      return NextResponse.json({ error: 'Invalid crew_id' }, { status: 400 });
    }

    // Check if user is a member of this crew
    const userCrew = getUserCrew(userId);
    if (!userCrew || userCrew.id !== crewId) {
      return NextResponse.json({ error: 'You are not a member of this crew' }, { status: 403 });
    }

    const messages = getCrewChatMessages(crewId);

    return NextResponse.json({ messages });
  } catch (error) {
    console.error('Crew chat messages error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

