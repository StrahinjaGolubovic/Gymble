# Railway Deployment Fixes

## ✅ Changes Applied for Railway Compatibility

### Problem
Railway requires:
1. App to respond with 200 on healthcheck endpoint
2. App to listen on `PORT` environment variable
3. Fast healthcheck response (no client-side redirects)

### Solutions Implemented

---

## 1. ✅ PORT Environment Variable Support

**File**: `package.json`

**Change**:
```json
"start": "next start -p ${PORT:-3000}"
```

**Why This Fixes Railway**:
- Railway injects `PORT` environment variable dynamically
- Next.js `next start` now reads `PORT` and binds to it
- Fallback to `3000` for local development
- Without this, app would bind to 3000 but Railway expects different port

---

## 2. ✅ Dedicated Healthcheck Endpoint

**File**: `app/api/health/route.ts` (NEW)

**Code**:
```typescript
import { NextResponse } from 'next/server';

// Railway healthcheck endpoint
// Returns 200 immediately without any database or auth checks
export async function GET() {
  return NextResponse.json({ 
    status: 'ok',
    timestamp: new Date().toISOString()
  }, { status: 200 });
}
```

**Why This Fixes Railway**:
- Returns immediate 200 response
- No database queries (fast response)
- No authentication required
- No client-side redirects
- Railway healthcheck passes instantly

**Previous Issue**:
- Root `/` page is client-side React component
- Makes API call to `/api/auth/me` before redirecting
- Takes 1800ms minimum (intentional loading animation)
- Railway healthcheck timed out waiting for response

---

## 3. ✅ Updated Railway Configuration

**File**: `railway.toml`

**Change**:
```toml
healthcheckPath = "/api/health"
```

**Previous**:
```toml
healthcheckPath = "/"
```

**Why This Fixes Railway**:
- Points to dedicated API endpoint instead of client page
- Immediate server-side response
- No JavaScript execution required
- No waiting for client-side routing

---

## 4. ✅ Bypass Rate Limiting for Healthcheck

**File**: `proxy.ts`

**Change**:
```typescript
// Skip rate limiting for healthcheck endpoint
if (pathname === '/api/health') {
  return NextResponse.next();
}

// Apply rate limiting to all API routes FIRST...
if (pathname.startsWith('/api/')) {
  // ... rate limiting logic
}
```

**Why This Fixes Railway**:
- Railway healthcheck can run unlimited times
- No risk of rate limit blocking healthcheck
- Ensures deployment doesn't fail due to rate limits
- Other security features remain intact

---

## Build Verification

```bash
npm run build
```

**Result**: ✅ **SUCCESS**
- ✓ Compiled successfully in 7.7s
- ✓ Finished TypeScript in 7.7s
- ✓ 74/74 routes built (including new `/api/health`)
- ✓ Exit code: 0

---

## Railway Deployment Checklist

### Environment Variables (Already Set in Railway):
- [x] `DATABASE_PATH="/data/gymble.db"`
- [x] `ALTCHA_HMAC_KEY="98ca8b3c5a7982ebca0ab99c5e27c8fd"`
- [x] `JWT_SECRET="5dbe29031ab98446aa3841548b44fdc2"`
- [x] `NODE_ENV="production"`
- [x] `PORT` (automatically injected by Railway)

### Configuration Files:
- [x] `railway.toml` - Updated healthcheck path
- [x] `Dockerfile` - Already configured correctly
- [x] `package.json` - Updated start script for PORT

### Code Changes:
- [x] `/api/health` endpoint created
- [x] `proxy.ts` bypasses healthcheck
- [x] All previous fixes intact

---

## Expected Railway Behavior

### Healthcheck:
```bash
curl https://your-app.railway.app/api/health
# Response: {"status":"ok","timestamp":"2025-12-30T04:52:00.000Z"}
# Status: 200 OK
```

### Port Binding:
```bash
# Railway sets PORT=8080 (or other)
# App starts: next start -p 8080
# App listens on: 0.0.0.0:8080
```

### Startup:
1. Railway builds Docker image
2. Runs `npm start`
3. App binds to `$PORT`
4. Railway hits `/api/health`
5. Gets 200 response
6. Deployment succeeds ✅

---

## All Previous Fixes Preserved

### ✅ Security Fixes Intact:
- Rate limiting on all API routes (except healthcheck)
- No hardcoded secrets (runtime validation)
- SQL injection fix (table whitelist)
- HTTPS enforcement (production)
- Security headers (CSP, HSTS, etc.)
- Strong password requirements

### ✅ Timezone Fixes Intact:
- Europe/Belgrade timezone everywhere
- No UTC offset issues
- Explicit timestamps in all INSERTs

### ✅ Other Fixes Intact:
- Feedback form working
- Bot protection (ALTCHA)
- Maintenance mode
- All features functional

---

## Testing Locally

```bash
# Set PORT environment variable
export PORT=8080

# Start app
npm start

# Test healthcheck
curl http://localhost:8080/api/health
# Expected: {"status":"ok","timestamp":"..."}

# Test root page still works
curl http://localhost:8080/
# Expected: HTML with React app
```

---

## Summary

| Issue | Fix | Status |
|-------|-----|--------|
| PORT not used | Updated start script | ✅ |
| Healthcheck timeout | Created `/api/health` | ✅ |
| Rate limit blocks healthcheck | Bypass in proxy.ts | ✅ |
| Railway config wrong | Updated railway.toml | ✅ |
| Build fails | Verified successful | ✅ |

**Railway deployment should now succeed.**

All changes are minimal, focused, and preserve all previous fixes (security, timezone, feedback, bots).
