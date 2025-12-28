import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { checkAdmin } from '@/lib/admin';
import { isMaintenanceModeEnabled } from '@/lib/settings';

export async function GET(request: NextRequest) {
  try {
    const maintenance = isMaintenanceModeEnabled();

    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    const adminCheck = await checkAdmin(token);

    return NextResponse.json({
      maintenance,
      isAdmin: adminCheck.isAdmin,
    });
  } catch (error) {
    console.error('Maintenance status error:', error);
    // Fail-open: if status endpoint fails, do not brick the site.
    return NextResponse.json({ maintenance: false, isAdmin: false });
  }
}


