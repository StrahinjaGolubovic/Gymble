import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { searchCrews } from '@/lib/crews';
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

    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q') || '';

    if (!query || query.length < 1) {
      return NextResponse.json({ crews: [] });
    }

    const crews = searchCrews(query, decoded.userId);

    return NextResponse.json({ crews });
  } catch (error) {
    console.error('Search crews error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

