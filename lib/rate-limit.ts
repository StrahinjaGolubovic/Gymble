// Rate limiting implementation for API routes
// Tracks requests per IP address with configurable windows and limits

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

const store: RateLimitStore = {};

// Cleanup old entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  Object.keys(store).forEach(key => {
    if (store[key].resetTime < now) {
      delete store[key];
    }
  });
}, 5 * 60 * 1000);

export interface RateLimitConfig {
  windowMs: number;  // Time window in milliseconds
  max: number;       // Max requests per window
}

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  resetTime: number;
}

export function checkRateLimit(
  identifier: string,
  config: RateLimitConfig
): RateLimitResult {
  const now = Date.now();
  const key = identifier;

  // Initialize or reset if window expired
  if (!store[key] || store[key].resetTime < now) {
    store[key] = {
      count: 1,
      resetTime: now + config.windowMs
    };
    return {
      success: true,
      limit: config.max,
      remaining: config.max - 1,
      resetTime: store[key].resetTime
    };
  }

  // Increment count
  store[key].count++;

  // Check if limit exceeded
  if (store[key].count > config.max) {
    return {
      success: false,
      limit: config.max,
      remaining: 0,
      resetTime: store[key].resetTime
    };
  }

  return {
    success: true,
    limit: config.max,
    remaining: config.max - store[key].count,
    resetTime: store[key].resetTime
  };
}

// Preset configurations
export const RATE_LIMITS = {
  // Strict limits for authentication endpoints
  AUTH: { windowMs: 15 * 60 * 1000, max: 5 },        // 5 per 15 minutes
  
  // Standard limits for most API endpoints
  STANDARD: { windowMs: 60 * 60 * 1000, max: 100 },  // 100 per hour
  
  // Stricter limits for resource-intensive operations
  UPLOAD: { windowMs: 60 * 60 * 1000, max: 20 },     // 20 per hour
  
  // Chat/messaging limits
  CHAT: { windowMs: 60 * 1000, max: 30 },            // 30 per minute
  
  // Admin operations (still limited but higher)
  ADMIN: { windowMs: 60 * 60 * 1000, max: 500 },     // 500 per hour
};

// Helper to get client IP from request
export function getClientIp(request: Request): string {
  // Check various headers for IP (in order of preference)
  const headers = request.headers;
  
  const forwarded = headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  
  const realIp = headers.get('x-real-ip');
  if (realIp) {
    return realIp;
  }
  
  const cfConnectingIp = headers.get('cf-connecting-ip');
  if (cfConnectingIp) {
    return cfConnectingIp;
  }
  
  // Fallback to a generic identifier
  return 'unknown';
}
