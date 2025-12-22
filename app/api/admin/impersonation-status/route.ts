import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { checkAdmin } from '@/lib/admin';

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const adminToken = cookieStore.get('admin_token')?.value;

    if (!adminToken) {
      return NextResponse.json({ impersonating: false });
    }

    const adminCheck = await checkAdmin(adminToken);
    if (!adminCheck.isAdmin) {
      return NextResponse.json({ impersonating: false });
    }

    return NextResponse.json({ impersonating: true });
  } catch (error) {
    console.error('Impersonation status error:', error);
    return NextResponse.json({ impersonating: false });
  }
}


