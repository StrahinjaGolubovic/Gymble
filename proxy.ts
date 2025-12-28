import { NextRequest, NextResponse } from 'next/server';

function isPublicAsset(pathname: string): boolean {
  if (pathname.startsWith('/_next/')) return true;
  if (pathname === '/favicon.ico') return true;
  if (pathname === '/sw.js' || pathname === '/worker.js') return true;
  if (pathname.startsWith('/android-chrome-') || pathname.startsWith('/apple-touch-icon')) return true;
  // public images/assets
  if (pathname.match(/\.(png|jpg|jpeg|gif|webp|svg|ico|css|js|map)$/i)) return true;
  return false;
}

// Proxy (previously called Middleware) — runs on Node.js runtime
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (isPublicAsset(pathname)) return NextResponse.next();

  // Avoid recursion / allow maintenance page and the status endpoint
  if (pathname.startsWith('/maintenance')) return NextResponse.next();
  if (pathname.startsWith('/api/maintenance/status')) return NextResponse.next();

  // Always allow auth endpoints & login page so admins can log in to disable maintenance
  if (pathname.startsWith('/login')) return NextResponse.next();
  if (pathname.startsWith('/api/auth/login')) return NextResponse.next();
  if (pathname.startsWith('/api/auth/logout')) return NextResponse.next();
  if (pathname.startsWith('/api/auth/me')) return NextResponse.next();

  // Ask the server (node runtime) whether maintenance is enabled and whether this user is an admin.
  try {
    const statusUrl = new URL('/api/maintenance/status', request.url);
    const res = await fetch(statusUrl, {
      headers: {
        cookie: request.headers.get('cookie') ?? '',
      },
      cache: 'no-store',
    });
    const json = (await res.json().catch(() => null)) as { maintenance?: boolean; isAdmin?: boolean } | null;
    const maintenance = !!json?.maintenance;
    const isAdmin = !!json?.isAdmin;

    if (maintenance && !isAdmin) {
      if (pathname.startsWith('/api/')) {
        return NextResponse.json({ error: 'Maintenance break. Please check again later.' }, { status: 503 });
      }
      const url = request.nextUrl.clone();
      url.pathname = '/maintenance';
      url.search = '';
      return NextResponse.redirect(url);
    }
  } catch {
    // Fail-open: if status check fails, don't brick the site.
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image).*)'],
};


