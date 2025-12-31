# COMPREHENSIVE CODEBASE AUDIT
**Project:** STREAKD (Gymble) - Fitness Tracking & Social Platform  
**Date:** December 31, 2025  
**Audit Type:** Full-Project Technical Review

---

## 1. PROJECT OVERVIEW

### 1.1 Purpose
STREAKD is a Next.js 16 fitness tracking application with social features. Users upload daily workout photos, maintain streaks, earn trophies, join crews, and compete on leaderboards. The system uses Serbia timezone (Europe/Belgrade) for all date/time operations.

### 1.2 Technology Stack
- **Framework:** Next.js 16.1.0 (App Router, React 19)
- **Database:** SQLite (better-sqlite3) with synchronous operations
- **Authentication:** JWT (jsonwebtoken) + bcrypt
- **File Storage:** Local filesystem (persistent volume on Railway)
- **Image Processing:** Client-side (exifr, heic2any, react-easy-crop)
- **Anti-Bot:** ALTCHA challenge-response
- **Deployment:** Railway with Docker support

### 1.3 Core Architecture

**Entry Points:**
- `app/page.tsx` - Landing/splash screen with auth check
- `app/dashboard/page.tsx` - Main authenticated user interface
- `app/api/**/route.ts` - 50+ API endpoints
- `lib/db.ts` - Database singleton with lazy initialization

**Data Flow:**
1. **User Registration** → JWT token → Cookie storage
2. **Daily Upload** → File save → Challenge update → Streak calculation → Trophy award
3. **Verification** → Admin approval/rejection → Trophy adjustment → Streak recomputation
4. **Weekly Challenge** → Auto-creation based on registration date → 7-day cycles
5. **Crews** → Join/leave → Aggregate stats → Leaderboard ranking

**State Management:**
- Server: SQLite database (single source of truth)
- Client: React state + periodic polling (no WebSockets)
- Session: HTTP-only cookies with JWT

---

## 2. CRITICAL BUGS & EDGE CASES

### 2.1 🔴 CRITICAL: Database Singleton Race Condition

**Location:** `lib/db.ts:35-99`

**Issue:** The database initialization uses module-level state with lazy initialization, but migrations run with a flag that can be reset on error:

```typescript
let migrationsRun = false;
// ...
if (!migrationsRun) {
  migrationsRun = true;
  try {
    // migrations...
  } catch (error: any) {
    migrationsRun = false; // ⚠️ RACE CONDITION
  }
}
```

**Problem:** In a concurrent environment (multiple API requests during startup), multiple threads could enter the migration block simultaneously before `migrationsRun` is set to `true`. This can cause:
- Duplicate migration attempts
- Foreign key constraint violations
- Database lock errors

**Impact:** HIGH - Can cause startup failures or data corruption

**Fix:**
```typescript
let migrationsLock = false;
if (!migrationsRun && !migrationsLock) {
  migrationsLock = true;
  try {
    // migrations...
    migrationsRun = true;
  } catch (error: any) {
    console.error('Migration: Error running migrations:', error?.message);
  } finally {
    migrationsLock = false;
  }
}
```

---

### 2.2 🔴 CRITICAL: Timezone Parsing Double-Conversion Bug

**Location:** `lib/timezone.ts:133-154`

**Issue:** The `parseSerbiaDate()` function attempts to compensate for timezone offset by detecting DST and subtracting hours:

```typescript
const offsetHours = tzName.includes('CEST') || tzName.includes('GMT+2') ? 2 : 1;
return new Date(Date.UTC(adjustedYear, adjustedMonth - 1, adjustedDay, hour - offsetHours, minute, second));
```

**Problems:**
1. **Fragile DST Detection:** Relies on string matching of timezone names, which vary by locale/browser
2. **Incorrect for Date-Only Strings:** The YYYY-MM-DD branch doesn't apply offset correction, creating inconsistency
3. **Breaks Around DST Transitions:** On DST switch days (last Sunday of March/October), the offset detection may be wrong for times near midnight

**Example Failure:**
```
Input: "2025-03-30 02:30:00" (during DST transition)
tempDate created at noon might show CET
But actual time 02:30 might be in CEST
Result: Wrong offset applied, 1-hour error
```

**Impact:** HIGH - Affects all timestamp displays (notifications, nudges, chat messages)

**Better Fix:**
```typescript
// Instead of guessing offset, use the inverse operation
// Store timestamps as UTC in DB, parse them as UTC, display with Serbia TZ
export function parseSerbiaDate(dateString: string): Date {
  if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
    const [year, month, day] = dateString.split('-').map(Number);
    return new Date(Date.UTC(year, month - 1, day, 0, 0, 0));
  }
  
  if (dateString.match(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/)) {
    const [datePart, timePart] = dateString.split(' ');
    const [year, month, day] = datePart.split('-').map(Number);
    const [hour, minute, second] = timePart.split(':').map(Number);
    
    // The string is ALREADY in Serbia time, stored as-is
    // To display correctly, we need to create a Date that when
    // formatted with Serbia TZ shows the original values
    // This means we store it as if it were UTC, then display adds offset
    return new Date(Date.UTC(year, month - 1, day, hour, minute, second));
  }
  
  throw new Error(`Unsupported date format: ${dateString}`);
}

// Then ALWAYS display with:
// dateObj.toLocaleString('en-US', { timeZone: 'Europe/Belgrade' })
```

**Root Cause:** Mixing "store as Serbia string" with "parse as UTC then convert" creates double-conversion errors.

---

### 2.3 🟡 HIGH: Streak Recomputation Logic Complexity

**Location:** `lib/challenges.ts:82-213`

**Issue:** The `recomputeUserStreakFromUploads()` function has multiple complex branches:
- Handles approved uploads + rest days
- Handles rejected uploads (force streak to 0)
- Handles admin baseline streaks
- Handles "too old" streak expiration

**Edge Cases:**
1. **Rejected Upload on Same Day as Rest Day:** If a user uses a rest day and uploads (which gets rejected), what happens?
   ```typescript
   const rejectedToday = !!db.prepare("SELECT 1 FROM daily_uploads WHERE user_id = ? AND upload_date = ? AND verification_status = 'rejected'").get(userId, today);
   ```
   This forces streak to 0, but the rest day is still valid. Inconsistent behavior.

2. **Admin Baseline Extension Logic:** Lines 178-185 extend baseline through consecutive dates, but doesn't check if those dates have APPROVED uploads—it just checks if dates exist in the set (which includes pending uploads).

3. **Duplicate Date Handling:** Line 128-130 skips duplicate dates with `continue`, but this could mask data integrity issues where multiple uploads exist for the same date.

**Impact:** MEDIUM - Can cause incorrect streak calculations in edge cases

**Recommendation:**
- Add explicit test cases for all edge case combinations
- Consider separating "rest day streak" from "upload streak" logic
- Add validation to prevent duplicate dates at insertion time

---

### 2.4 🟡 HIGH: Trophy Transaction Ledger Not Atomic

**Location:** `lib/trophies.ts:95-213`

**Issue:** Trophy awards/penalties are recorded in `trophy_transactions` table, then user's `trophies` column is updated separately. These are NOT in a transaction:

```typescript
// In various places:
db.prepare('INSERT INTO trophy_transactions ...').run(...);
db.prepare('UPDATE users SET trophies = trophies + ? WHERE id = ?').run(delta, userId);
```

**Problem:** If the process crashes between these two operations:
- Transaction is recorded but user balance not updated (user loses trophies)
- Or vice versa if order is reversed

**Impact:** MEDIUM - Can cause trophy balance inconsistencies

**Fix:** Wrap in SQLite transaction:
```typescript
const transaction = db.prepare(`
  BEGIN TRANSACTION;
  INSERT INTO trophy_transactions (user_id, upload_id, delta, reason, created_at) VALUES (?, ?, ?, ?, ?);
  UPDATE users SET trophies = trophies + ? WHERE id = ?;
  COMMIT;
`);
transaction.run(userId, uploadId, delta, reason, createdAt, delta, userId);
```

---

### 2.5 🟡 MEDIUM: Rate Limiting In-Memory Store Loss

**Location:** `lib/rate-limit.ts:11-21`

**Issue:** Rate limit counters are stored in a module-level object:
```typescript
const store: RateLimitStore = {};
```

**Problems:**
1. **Lost on Server Restart:** All rate limit state is lost, allowing users to bypass limits by triggering restarts
2. **Not Shared Across Instances:** In multi-instance deployments (horizontal scaling), each instance has its own store
3. **Memory Leak Potential:** The cleanup interval runs every 5 minutes, but if keys accumulate faster than cleanup, memory grows unbounded

**Impact:** MEDIUM - Rate limits can be bypassed

**Recommendation:**
- Use Redis or database-backed rate limiting for production
- Add max store size limit with LRU eviction
- Document that this is single-instance only

---

### 2.6 🟡 MEDIUM: File Upload Race Condition

**Location:** `app/api/upload/route.ts:79-86`

**Issue:** File saving uses timestamp-based filenames:
```typescript
const timestamp = Date.now();
const filename = `${timestamp}.${extension}`;
```

**Problem:** If two uploads happen in the same millisecond (possible with fast clients or multiple tabs), they'll have the same filename, causing one to overwrite the other.

**Impact:** MEDIUM - Rare but possible data loss

**Fix:**
```typescript
const timestamp = Date.now();
const random = Math.random().toString(36).substring(2, 8);
const filename = `${timestamp}-${random}.${extension}`;
```

---

### 2.7 🟡 MEDIUM: Challenge Week Boundary Edge Case

**Location:** `lib/challenges.ts:218-242`

**Issue:** Week calculation uses registration date as anchor:
```typescript
const daysSinceReg = diffDaysYMD(currentDateStr, regDateStr);
const weekNumber = Math.floor(daysSinceReg / 7);
```

**Edge Case:** If a user registers at 23:59 Serbia time, and the server processes it at 00:00 UTC (next day), the registration date might be off by one day depending on when `formatDateSerbia()` is called vs when `created_at` is stored.

**Impact:** MEDIUM - Week boundaries could be off by 1 day for some users

**Verification Needed:** Check if `created_at` is always set using `formatDateTimeSerbia()` or if it relies on `DEFAULT CURRENT_TIMESTAMP` (which is UTC).

---

### 2.8 🟢 LOW: Missing Input Validation

**Location:** Multiple API endpoints

**Issues:**
1. **Username Length:** `app/api/auth/register/route.ts` checks 3-20 chars, but database has no constraint
2. **Crew Name Validation:** `lib/crews.ts:90-96` validates regex but doesn't trim whitespace first
3. **Chat Message Length:** No max length validation, could allow extremely long messages

**Impact:** LOW - Could cause UI issues or storage bloat

---

### 2.9 🟢 LOW: Hardcoded Magic Numbers

**Locations:**
- `lib/trophies.ts:19` - Trophy range 26-32 (why these numbers?)
- `lib/crews.ts:67` - MAX_CREW_MEMBERS = 30 (not configurable)
- `lib/challenges.ts:137` - rest_days_available = 3 (hardcoded)
- `lib/rate-limit.ts:78-93` - All rate limit values

**Impact:** LOW - Makes tuning difficult without code changes

**Recommendation:** Move to environment variables or database settings table

---

## 3. RISKY & FRAGILE CODE PATTERNS

### 3.1 🔴 CRITICAL: JWT Secret Validation Timing

**Location:** `lib/auth.ts:6-12`

**Issue:**
```typescript
function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('CRITICAL: JWT_SECRET environment variable must be set');
  }
  return secret;
}
```

**Problem:** This only throws when a JWT operation is attempted, NOT at startup. If `JWT_SECRET` is missing, the app starts successfully but crashes on first auth attempt.

**Impact:** HIGH - Silent failure mode

**Fix:** Validate at module load:
```typescript
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET && process.env.NODE_ENV === 'production') {
  throw new Error('CRITICAL: JWT_SECRET must be set in production');
}
```

---

### 3.2 🟡 HIGH: Database Path Resolution Fragility

**Location:** `lib/db.ts:5, 14-16, 68-70`

**Issue:** Database path logic has multiple fallback strategies:
```typescript
const dbPath = process.env.DATABASE_PATH || './data/gymble.db';
// ...
const dataDir = process.env.DATABASE_PATH 
  ? join(process.env.DATABASE_PATH, '..')
  : join(process.cwd(), 'data');
```

**Problems:**
1. **Inconsistent Interpretation:** `DATABASE_PATH` is sometimes treated as a file path, sometimes as a directory
2. **Parent Directory Assumption:** `join(DATABASE_PATH, '..')` assumes DATABASE_PATH is a file, but what if it's already a directory?
3. **CWD Dependency:** `process.cwd()` can change during runtime in some environments

**Impact:** HIGH - Could write database to wrong location or fail to find it

**Fix:** Standardize on directory-based configuration:
```typescript
const DATA_DIR = process.env.DATA_DIR || join(process.cwd(), 'data');
const dbPath = join(DATA_DIR, 'gymble.db');
```

---

### 3.3 🟡 MEDIUM: Tight Coupling to Timezone Module

**Issue:** 15+ files import from `lib/timezone.ts`, and all date operations depend on it working correctly. Any bug in timezone handling cascades everywhere.

**Risk:** The recent timezone fixes show this is a fragile area. The DST detection logic is particularly risky.

**Recommendation:**
- Add comprehensive timezone unit tests
- Consider using a battle-tested library like `date-fns-tz` or `luxon`
- Document timezone assumptions clearly

---

### 3.4 🟡 MEDIUM: Silent Error Swallowing

**Locations:**
- `lib/trophies.ts:50-53, 75-77` - Catches errors and sets `false` without logging
- `lib/challenges.ts:271-282` - Try-catch for missing column, assumes default
- `lib/db.ts:59-62, 87-89` - Logs but continues on migration failure

**Problem:** Errors are caught and ignored, making debugging difficult. Production issues may go unnoticed.

**Recommendation:**
- Always log caught errors with context
- Use error tracking service (Sentry, etc.)
- Distinguish between "expected" errors (missing column during migration) and unexpected errors

---

### 3.5 🟡 MEDIUM: Order-Dependent Initialization

**Location:** `lib/db.ts:42-44`

**Issue:**
```typescript
if (!initialized) {
  initDatabase(databaseInstance);
  initialized = true;
}
```

**Problem:** If `initDatabase()` throws an exception, `initialized` stays `false`, but `databaseInstance` is already created. Next call will try to initialize again on a partially-initialized database.

**Fix:**
```typescript
if (!initialized) {
  try {
    initDatabase(databaseInstance);
    initialized = true;
  } catch (error) {
    databaseInstance = null; // Reset on failure
    throw error;
  }
}
```

---

### 3.6 🟢 LOW: Reliance on Undefined Behavior

**Location:** `lib/challenges.ts:14`

**Issue:**
```typescript
const dt = new Date(Date.UTC(year, month - 1, day + deltaDays));
```

**Problem:** When `day + deltaDays` exceeds the month's day count, JavaScript's Date constructor "rolls over" to the next month. This is intentional behavior, but it's implicit and could be misunderstood.

**Example:** `new Date(Date.UTC(2025, 0, 32))` → `2025-02-01`

**Impact:** LOW - Works correctly but is non-obvious

**Recommendation:** Add comment explaining rollover behavior

---

## 4. DEAD, UNUSED, OR MISLEADING CODE

### 4.1 Unused API Endpoints

**Location:** `app/api/cleanup-activity/route.ts`

**Status:** Endpoint exists but is never called by the frontend. Appears to be for manual cleanup.

**Recommendation:** Either integrate into a cron job or remove if obsolete.

---

### 4.2 Duplicate Admin Endpoints

**Locations:**
- `app/api/admin/reset-debt/route.ts`
- `app/api/admin/reset-user-debt/route.ts`

**Issue:** Two endpoints that appear to do the same thing (reset user debt/credits). One may be obsolete.

**Recommendation:** Consolidate or clarify purpose.

---

### 4.3 Unused Imports

**Multiple files** have unused imports. Examples:
- `lib/challenges.ts:2` imports `isTodaySerbia, isPastSerbia` but never uses them
- Several files import `formatDateDisplay` but use `formatDateTimeDisplay` instead

**Impact:** LOW - Code bloat, confusing for maintenance

**Recommendation:** Run ESLint with unused-imports rule

---

### 4.4 Commented-Out Code

**Location:** None found (good!)

---

### 4.5 Misleading Function Names

**Location:** `lib/timezone.ts:201-203`

```typescript
export function getSerbiaNow(): Date {
  return new Date();
}
```

**Issue:** Name suggests it returns Serbia time, but it actually returns a UTC Date object. The comment says "but this helps with comparisons when treating dates as Serbia local time" which is confusing.

**Recommendation:** Rename to `getCurrentDate()` or remove if unused.

---

### 4.6 Redundant Database Migrations

**Location:** `lib/db.ts:52-63, 143-153`

**Issue:** The same migration (adding `rest_days_available` column) appears twice:
1. In `getDb()` function (lines 52-63)
2. In `initDatabase()` function (lines 143-153)

**Problem:** Redundant code, increases maintenance burden.

**Recommendation:** Remove from `initDatabase()` since `getDb()` handles it.

---

## 5. WHAT WORKS AND WHY

### 5.1 ✅ Database Schema Design

**Strengths:**
- Proper foreign key constraints with CASCADE/SET NULL
- Comprehensive indexes on frequently queried columns
- Unique constraints prevent duplicate data (e.g., `UNIQUE(from_user_id, to_user_id, nudge_date)`)
- Audit trail via `trophy_transactions` table

**Why It Works:**
- SQLite's synchronous nature eliminates async complexity
- Foreign keys ensure referential integrity
- Indexes make queries fast even with thousands of records

---

### 5.2 ✅ Trophy System Logic

**Location:** `lib/trophies.ts`

**Strengths:**
- Deterministic rewards (based on uploadId, not random)
- Penalty for streak breaks (half rewards)
- Rejection penalty is 2x base (discourages cheating)
- Ledger system allows auditing

**Why It Works:**
- Using uploadId as seed prevents re-rolling rewards
- Math is simple and predictable
- Penalties are harsh enough to discourage bad behavior

**Assumption:** Users can't manipulate uploadId (true, it's server-generated)

---

### 5.3 ✅ Streak Calculation Core Logic

**Location:** `lib/challenges.ts:119-139`

**Strengths:**
- Handles consecutive day detection correctly
- Accounts for rest days as valid activity
- Recomputes from scratch on verification changes

**Why It Works:**
- Uses date string comparison (YYYY-MM-DD), which is timezone-safe
- Sorts dates before processing, ensuring correct order
- Longest streak is max of all runs, not just current

**Assumption:** All dates are stored in YYYY-MM-DD format (true)

---

### 5.4 ✅ Authentication Flow

**Location:** `lib/auth.ts`, `app/api/auth/*`

**Strengths:**
- Bcrypt with salt rounds = 10 (good balance)
- JWT with 7-day expiration
- HTTP-only cookies (prevents XSS theft)
- Token verification on every protected route

**Why It Works:**
- Bcrypt is slow enough to resist brute force
- JWT is stateless (no session storage needed)
- Cookies are more secure than localStorage

**Assumption:** JWT_SECRET is strong and secret (must be enforced)

---

### 5.5 ✅ Rate Limiting Implementation

**Location:** `lib/rate-limit.ts`

**Strengths:**
- Simple sliding window algorithm
- Automatic cleanup of old entries
- Configurable limits per endpoint type
- Returns remaining count to client

**Why It Works:**
- In-memory store is fast (no DB overhead)
- Cleanup interval prevents memory leaks
- Different limits for different risk levels (auth vs chat)

**Limitation:** Single-instance only, not shared across servers

---

### 5.6 ✅ Image Upload Validation

**Location:** `app/api/upload/route.ts:38-55`

**Strengths:**
- Validates file type (must be image)
- Rejects HEIC (not browser-compatible)
- 5MB size limit
- Server-side validation (can't be bypassed)

**Why It Works:**
- Multiple validation layers (type, extension, size)
- Clear error messages
- Prevents storage bloat

---

### 5.7 ✅ Crew System Constraints

**Location:** `lib/crews.ts`

**Strengths:**
- Max 30 members per crew (prevents mega-crews)
- Unique crew names (prevents confusion)
- Leader can't leave (must transfer first)
- Bidirectional checks (user can only be in one crew)

**Why It Works:**
- Database constraints enforce rules
- Business logic validates before DB operations
- Clear error messages for violations

---

## 6. CONCRETE IMPROVEMENT SUGGESTIONS

### 6.1 🔴 CRITICAL FIXES (Do Immediately)

#### 6.1.1 Fix Database Migration Race Condition
```typescript
// lib/db.ts
let migrationsLock = false;

if (!migrationsRun && !migrationsLock) {
  migrationsLock = true;
  try {
    // ... existing migration code ...
    migrationsRun = true;
  } catch (error: any) {
    console.error('Migration failed:', error);
  } finally {
    migrationsLock = false;
  }
}
```

#### 6.1.2 Validate JWT_SECRET at Startup
```typescript
// lib/auth.ts (at module level)
if (!process.env.JWT_SECRET && process.env.NODE_ENV === 'production') {
  throw new Error('FATAL: JWT_SECRET must be set in production');
}
```

#### 6.1.3 Wrap Trophy Transactions in SQLite Transaction
```typescript
// lib/trophies.ts - Create helper function
function recordTrophyTransaction(userId: number, uploadId: number | null, delta: number, reason: string) {
  const createdAt = formatDateTimeSerbia();
  
  db.exec('BEGIN TRANSACTION');
  try {
    db.prepare('INSERT INTO trophy_transactions (user_id, upload_id, delta, reason, created_at) VALUES (?, ?, ?, ?, ?)')
      .run(userId, uploadId, delta, reason, createdAt);
    db.prepare('UPDATE users SET trophies = trophies + ? WHERE id = ?')
      .run(delta, userId);
    db.exec('COMMIT');
  } catch (error) {
    db.exec('ROLLBACK');
    throw error;
  }
}
```

---

### 6.2 🟡 HIGH PRIORITY (Do Soon)

#### 6.2.1 Simplify Timezone Handling
**Current Problem:** Complex DST detection logic is fragile.

**Better Approach:**
1. Store all timestamps as UTC in database (use `DATETIME` type)
2. Convert to Serbia timezone only for display
3. Remove offset subtraction logic from `parseSerbiaDate()`

```typescript
// Simplified approach:
export function formatDateTimeSerbia(date: Date = new Date()): string {
  // Store as ISO UTC string
  return date.toISOString();
}

export function displaySerbiaTime(isoString: string): string {
  return new Date(isoString).toLocaleString('en-US', {
    timeZone: 'Europe/Belgrade'
  });
}
```

#### 6.2.2 Add Unique Constraint to File Uploads
```typescript
// app/api/upload/route.ts
const timestamp = Date.now();
const random = crypto.randomBytes(4).toString('hex');
const filename = `${timestamp}-${random}.${extension}`;
```

#### 6.2.3 Add Comprehensive Error Logging
```typescript
// Create lib/logger.ts
export function logError(context: string, error: any, metadata?: any) {
  console.error(`[${context}]`, error, metadata);
  // TODO: Send to error tracking service (Sentry, etc.)
}

// Use everywhere instead of console.error
```

---

### 6.3 🟢 MEDIUM PRIORITY (Nice to Have)

#### 6.3.1 Extract Magic Numbers to Configuration
```typescript
// lib/config.ts
export const CONFIG = {
  TROPHIES: {
    BASE_MIN: 26,
    BASE_MAX: 32,
    REJECTION_MULTIPLIER: 2,
    STREAK_BREAK_PENALTY: 0.5,
  },
  CREWS: {
    MAX_MEMBERS: 30,
    NAME_MIN_LENGTH: 3,
    NAME_MAX_LENGTH: 30,
  },
  CHALLENGES: {
    REST_DAYS_PER_WEEK: 3,
    DAYS_PER_WEEK: 7,
  },
  UPLOADS: {
    MAX_SIZE_MB: 5,
    ALLOWED_TYPES: ['image/jpeg', 'image/png', 'image/webp'],
  },
};
```

#### 6.3.2 Add Database Backup Mechanism
```typescript
// scripts/backup-db.mjs
import { copyFileSync } from 'fs';
import { join } from 'path';

const dbPath = process.env.DATABASE_PATH || './data/gymble.db';
const backupPath = join(dirname(dbPath), `gymble-backup-${Date.now()}.db`);
copyFileSync(dbPath, backupPath);
console.log(`Backup created: ${backupPath}`);
```

#### 6.3.3 Add Health Check Endpoint
```typescript
// app/api/health/route.ts - Enhance existing
export async function GET() {
  const checks = {
    database: false,
    filesystem: false,
    memory: process.memoryUsage(),
  };
  
  try {
    db.prepare('SELECT 1').get();
    checks.database = true;
  } catch {}
  
  try {
    existsSync(join(process.cwd(), 'data'));
    checks.filesystem = true;
  } catch {}
  
  const healthy = checks.database && checks.filesystem;
  return NextResponse.json(checks, { status: healthy ? 200 : 503 });
}
```

---

### 6.4 🔵 LOW PRIORITY (Future Enhancements)

#### 6.4.1 Add Database Connection Pooling
Currently using singleton. For high concurrency, consider connection pooling (though SQLite's write serialization limits benefits).

#### 6.4.2 Implement Proper Logging Framework
Replace `console.log/error` with structured logging (Winston, Pino).

#### 6.4.3 Add Performance Monitoring
Track slow queries, API response times, memory usage.

#### 6.4.4 Implement Caching Layer
Cache frequently accessed data (leaderboards, crew stats) with Redis or in-memory cache.

---

## 7. TESTING RECOMMENDATIONS

### 7.1 Critical Test Cases Needed

#### Timezone Tests
```javascript
// Test DST transitions
test('parseSerbiaDate handles DST spring forward', () => {
  // March 30, 2025 - DST starts
  const result = parseSerbiaDate('2025-03-30 02:30:00');
  // Verify correct handling
});

test('parseSerbiaDate handles DST fall back', () => {
  // October 26, 2025 - DST ends
  const result = parseSerbiaDate('2025-10-26 02:30:00');
  // Verify correct handling
});
```

#### Streak Calculation Tests
```javascript
test('streak handles rejected upload on rest day', () => {
  // User uses rest day
  // User also uploads (gets rejected)
  // Verify streak behavior
});

test('streak handles admin baseline extension', () => {
  // Set admin baseline
  // Add consecutive uploads
  // Verify baseline extends correctly
});
```

#### Concurrency Tests
```javascript
test('concurrent uploads to same date fail gracefully', () => {
  // Simulate two simultaneous uploads
  // Verify only one succeeds
  // Verify proper error message
});
```

---

## 8. SECURITY CONSIDERATIONS

### 8.1 ✅ Good Security Practices
- JWT in HTTP-only cookies (prevents XSS)
- Bcrypt password hashing
- Rate limiting on auth endpoints
- File type validation on uploads
- SQL injection prevention (prepared statements)
- CSRF protection via same-site cookies

### 8.2 ⚠️ Security Concerns

#### 8.2.1 Missing HTTPS Enforcement
No code enforces HTTPS. In production, ensure:
```typescript
// middleware.ts (create if missing)
if (process.env.NODE_ENV === 'production' && !request.headers.get('x-forwarded-proto')?.includes('https')) {
  return NextResponse.redirect(`https://${request.headers.get('host')}${request.nextUrl.pathname}`);
}
```

#### 8.2.2 No Request Size Limits
File uploads are limited to 5MB, but JSON payloads have no size limit. Could allow DoS via large JSON.

**Fix:** Add body size limit in `next.config.js`:
```javascript
experimental: {
  serverActions: {
    bodySizeLimit: '2mb'
  }
}
```

#### 8.2.3 Admin Impersonation Risk
`app/api/admin/impersonate/route.ts` allows admins to impersonate users. This is powerful but risky if admin account is compromised.

**Recommendation:**
- Add audit logging for all impersonation events
- Require re-authentication before impersonation
- Add time limit to impersonation sessions

---

## 9. PERFORMANCE ANALYSIS

### 9.1 Database Query Performance

**Efficient Queries:**
- Most queries use indexed columns (user_id, upload_date, etc.)
- Proper use of LIMIT clauses
- Aggregations use COUNT/SUM efficiently

**Potential Bottlenecks:**
- `recomputeUserStreakFromUploads()` does multiple queries per user (could be optimized with JOINs)
- Leaderboard queries scan entire tables (consider materialized views)
- Chat message cleanup runs on every message fetch (should be background job)

### 9.2 File System Performance

**Current:** Synchronous file operations (`writeFile`, `mkdir`)

**Risk:** Blocks event loop during large uploads

**Fix:** Already using `fs/promises` (async), which is good.

### 9.3 Memory Usage

**Concerns:**
- Rate limit store grows unbounded between cleanups
- No pagination on some list endpoints (could return thousands of records)

**Recommendation:**
- Add max size limit to rate limit store
- Implement pagination on all list endpoints

---

## 10. DEPLOYMENT & OPERATIONS

### 10.1 Environment Variables Required
```bash
# Critical
JWT_SECRET=<strong-random-string>
DATABASE_PATH=/data/gymble.db  # Or DATA_DIR=/data

# Optional
PORT=3000
NODE_ENV=production
ALTCHA_HMAC_KEY=<random-string>
```

### 10.2 Startup Checklist
1. Verify JWT_SECRET is set
2. Verify database directory is writable
3. Verify uploads directory is writable
4. Run database migrations
5. Check health endpoint

### 10.3 Monitoring Recommendations
- Track API response times (especially upload, verification)
- Monitor database size growth
- Alert on migration failures
- Track rate limit violations
- Monitor memory usage

---

## 11. SUMMARY & RISK MATRIX

| Issue | Severity | Impact | Likelihood | Priority |
|-------|----------|--------|------------|----------|
| Database migration race condition | CRITICAL | HIGH | MEDIUM | 🔴 P0 |
| Timezone DST detection fragility | CRITICAL | HIGH | HIGH | 🔴 P0 |
| Trophy transaction atomicity | HIGH | MEDIUM | LOW | 🟡 P1 |
| JWT secret validation timing | HIGH | HIGH | LOW | 🟡 P1 |
| File upload race condition | MEDIUM | LOW | LOW | 🟡 P2 |
| Rate limiting memory leak | MEDIUM | MEDIUM | MEDIUM | 🟡 P2 |
| Missing input validation | LOW | LOW | MEDIUM | 🟢 P3 |
| Hardcoded magic numbers | LOW | LOW | LOW | 🟢 P3 |

---

## 12. CONCLUSION

**Overall Assessment:** The codebase is **functionally solid** with good architecture and clear separation of concerns. The core business logic (streaks, trophies, challenges) is well-designed and mostly correct.

**Main Weaknesses:**
1. **Timezone handling** - Overly complex and fragile
2. **Concurrency safety** - Several race conditions in initialization and file operations
3. **Error handling** - Too much silent error swallowing
4. **Testing** - No automated tests for critical edge cases

**Strengths:**
1. Clean database schema with proper constraints
2. Deterministic trophy system prevents gaming
3. Good authentication and authorization
4. Reasonable rate limiting
5. Clear code structure and naming

**Recommended Action Plan:**
1. **Week 1:** Fix critical issues (migration race, timezone, JWT validation)
2. **Week 2:** Add comprehensive tests for timezone and streak logic
3. **Week 3:** Improve error logging and monitoring
4. **Week 4:** Extract configuration and add health checks

**Risk Level:** MEDIUM - The application works well in normal cases, but has edge cases that could cause issues under load or in specific timezone scenarios. No critical security vulnerabilities, but operational risks exist.
