import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { getCrewDetails, getCrewMembers, getCrewRequests } from '@/lib/crews';
import { cookies } from 'next/headers';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;
    const crewId = parseInt(id, 10);

    if (isNaN(crewId)) {
      return NextResponse.json({ error: 'Invalid crew ID' }, { status: 400 });
    }

    const crew = getCrewDetails(crewId, decoded.userId);

    if (!crew) {
      return NextResponse.json({ error: 'Crew not found' }, { status: 404 });
    }

    const members = getCrewMembers(crewId);
    let requests: any[] = [];

    // Only leaders can see pending requests
    if (crew.is_leader) {
      requests = getCrewRequests(crewId, decoded.userId);
    }

    return NextResponse.json({ crew, members, requests });
  } catch (error) {
    console.error('Get crew details error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

