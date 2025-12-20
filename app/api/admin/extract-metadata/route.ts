import { NextRequest, NextResponse } from 'next/server';
import { checkAdmin } from '@/lib/admin';
import { extractImageMetadata } from '@/lib/verification';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;

    const adminCheck = await checkAdmin(token);
    if (!adminCheck.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { photoPath } = await request.json();

    if (!photoPath) {
      return NextResponse.json({ error: 'Photo path is required' }, { status: 400 });
    }

    const metadata = await extractImageMetadata(photoPath);

    return NextResponse.json({ metadata });
  } catch (error) {
    console.error('Extract metadata error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

