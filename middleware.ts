import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { checkRateLimit, getClientIp, RATE_LIMITS, type RateLimitConfig } from './lib/rate-limit';

// Route-specific rate limit configurations
const ROUTE_LIMITS: { [key: string]: RateLimitConfig } = {
  // Authentication routes - strict
  '/api/auth/login': RATE_LIMITS.AUTH,
  '/api/auth/register': RATE_LIMITS.AUTH,
  
  // Upload routes - moderate
  '/api/upload': RATE_LIMITS.UPLOAD,
  '/api/profile/picture': RATE_LIMITS.UPLOAD,
  
  // Chat routes - per-minute limits
  '/api/chat/send': RATE_LIMITS.CHAT,
  '/api/crew-chat/send': RATE_LIMITS.CHAT,
  
  // Admin routes - higher limits
  '/api/admin': RATE_LIMITS.ADMIN,
};

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Apply rate limiting to all API routes
  if (pathname.startsWith('/api/')) {
    const clientIp = getClientIp(request);
    
    // Determine rate limit config for this route
    let config = RATE_LIMITS.STANDARD; // Default
    
    // Check for specific route configs
    for (const [route, limit] of Object.entries(ROUTE_LIMITS)) {
      if (pathname.startsWith(route)) {
        config = limit;
        break;
      }
    }
    
    // Check rate limit
    const result = checkRateLimit(`${clientIp}:${pathname}`, config);
    
    if (!result.success) {
      return NextResponse.json(
        { 
          error: 'Too many requests. Please try again later.',
          retryAfter: Math.ceil((result.resetTime - Date.now()) / 1000)
        },
        { 
          status: 429,
          headers: {
            'Retry-After': String(Math.ceil((result.resetTime - Date.now()) / 1000)),
            'X-RateLimit-Limit': String(result.limit),
            'X-RateLimit-Remaining': String(result.remaining),
            'X-RateLimit-Reset': String(result.resetTime),
          }
        }
      );
    }
    
    // Add rate limit headers to successful responses
    const response = NextResponse.next();
    response.headers.set('X-RateLimit-Limit', String(result.limit));
    response.headers.set('X-RateLimit-Remaining', String(result.remaining));
    response.headers.set('X-RateLimit-Reset', String(result.resetTime));
    
    return response;
  }
  
  // Force HTTPS in production
  if (process.env.NODE_ENV === 'production') {
    const proto = request.headers.get('x-forwarded-proto');
    if (proto && proto !== 'https') {
      const host = request.headers.get('host');
      if (host) {
        return NextResponse.redirect(
          `https://${host}${pathname}${request.nextUrl.search}`,
          301
        );
      }
    }
  }
  
  // Add security headers
  const response = NextResponse.next();
  
  // Prevent clickjacking
  response.headers.set('X-Frame-Options', 'DENY');
  
  // Prevent MIME type sniffing
  response.headers.set('X-Content-Type-Options', 'nosniff');
  
  // Referrer policy
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Permissions policy
  response.headers.set('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  
  // Content Security Policy
  response.headers.set(
    'Content-Security-Policy',
    "default-src 'self'; " +
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'; " +
    "style-src 'self' 'unsafe-inline'; " +
    "img-src 'self' data: blob:; " +
    "font-src 'self' data:; " +
    "connect-src 'self';"
  );
  
  // Strict-Transport-Security (HSTS) - only in production
  if (process.env.NODE_ENV === 'production') {
    response.headers.set(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains; preload'
    );
  }
  
  return response;
}

export const config = {
  matcher: [
    // Match all API routes
    '/api/:path*',
    // Match all pages (for HTTPS redirect and security headers)
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
