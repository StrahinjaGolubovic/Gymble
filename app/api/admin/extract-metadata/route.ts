import { NextRequest, NextResponse } from 'next/server';
import { checkAdmin } from '@/lib/admin';
import { extractImageMetadata } from '@/lib/verification';
import { cookies } from 'next/headers';
import db from '@/lib/db';

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

    // Prefer stored metadata (captured at upload time) if present.
    const row = db
      .prepare('SELECT metadata FROM daily_uploads WHERE photo_path = ? LIMIT 1')
      .get(photoPath) as { metadata: string | null } | undefined;

    if (row?.metadata) {
      try {
        return NextResponse.json({ metadata: JSON.parse(row.metadata) });
      } catch {
        // fall through to file-based extraction
      }
    }

    const metadata = await extractImageMetadata(photoPath);

    return NextResponse.json({ metadata });
  } catch (error) {
    console.error('Extract metadata error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

