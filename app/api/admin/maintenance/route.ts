import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { checkAdmin } from '@/lib/admin';
import { isMaintenanceModeEnabled, setMaintenanceModeEnabled } from '@/lib/settings';

export async function GET(request: NextRequest) {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;
  const adminCheck = await checkAdmin(token);
  if (!adminCheck.isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

  return NextResponse.json({ maintenance: isMaintenanceModeEnabled() });
}

export async function POST(request: NextRequest) {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;
  const adminCheck = await checkAdmin(token);
  if (!adminCheck.isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

  const body = await request.json().catch(() => ({}));
  const enabled = !!body?.enabled;
  setMaintenanceModeEnabled(enabled);

  return NextResponse.json({ success: true, maintenance: enabled });
}


