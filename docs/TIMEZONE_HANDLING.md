# Timezone Handling - Europe/Belgrade

## Overview

**STREAKD.** enforces **Europe/Belgrade (Serbia)** timezone as the single source of truth across the entire application. All dates are stored and processed in Serbia timezone to ensure consistency regardless of where the server or users are located.

## Core Principles

### 1. **Use YYYY-MM-DD Strings for Date Logic**
- All date comparisons, arithmetic, and storage use `YYYY-MM-DD` strings
- Never use JavaScript `Date` objects for business logic
- Date objects are only for display purposes with `Intl.DateTimeFormat`

### 2. **Serbia Timezone Functions**
All timezone-aware operations use functions from `lib/timezone.ts`:

```typescript
// Get current date in Serbia timezone
formatDateSerbia()  // Returns: "2025-12-30"

// Get current datetime in Serbia timezone  
formatDateTimeSerbia()  // Returns: "2025-12-30 04:31:00"

// Add/subtract days (timezone-agnostic string arithmetic)
addDaysYMD("2025-12-30", 7)  // Returns: "2026-01-06"

// Calculate day difference
diffDaysYMD("2025-12-30", "2025-12-20")  // Returns: 10

// Check if date is today in Serbia
isTodaySerbia("2025-12-30")  // Returns: true/false

// Check if date is in the past in Serbia
isPastSerbia("2025-12-29")  // Returns: true/false
```

### 3. **Display Formatting**
For displaying dates to users, use:

```typescript
// Format for display (e.g., "Dec 30, 2025")
formatDateDisplay(dateString, { month: 'short', day: 'numeric', year: 'numeric' })

// Format datetime for display (e.g., "12/30/2025, 4:31:00 AM")
formatDateTimeDisplay(dateString)

// Format time only (e.g., "04:31")
formatTimeDisplay(dateString)
```

## Fixed Issues

### ❌ **Before: Incorrect Timezone Handling**

```typescript
// WRONG: Uses local timezone
const weekStart = new Date(year, month - 1, day);
weekStart.setHours(0, 0, 0, 0);

// WRONG: Uses local timezone for "today"
const today = new Date().toISOString().split('T')[0];

// WRONG: Date arithmetic with local timezone
const end = new Date(weekStart);
end.setDate(end.getDate() + 6);
```

### ✅ **After: Correct Timezone Handling**

```typescript
// CORRECT: Uses Serbia timezone string
const weekStart = getWeekStartForUser(registrationDate);  // Returns "2025-12-30"

// CORRECT: Uses Serbia timezone for "today"
const today = formatDateSerbia();  // Returns "2025-12-30"

// CORRECT: String-based date arithmetic
const weekEnd = addDaysYMD(weekStart, 6);  // Returns "2026-01-05"
```

## Key Changes Made

### 1. **Week Calculation Functions** (`lib/challenges.ts`)
- `getWeekStartForUser()` now returns `string` instead of `Date`
- `getWeekEndForUser()` now returns `string` instead of `Date`
- All date arithmetic uses `addDaysYMD()` and `diffDaysYMD()`

### 2. **API Routes**
- `/api/friends/nudge` - Uses `formatDateSerbia()` for today's date
- `/api/friends/list` - Uses `formatDateSerbia()` for today's date
- `/api/upload` - Already correctly uses `formatDateSerbia()`

### 3. **Library Functions**
- `lib/friends.ts` - Uses `formatDateSerbia()` instead of `new Date().toISOString()`
- `lib/chat.ts` - Uses `formatDateTimeSerbia()` for cutoff times

## Date Storage in Database

All dates in the database are stored as **YYYY-MM-DD** or **YYYY-MM-DD HH:MM:SS** strings in Serbia timezone:

```sql
-- Users table
created_at DATE  -- "2025-12-30"

-- Weekly challenges
start_date DATE  -- "2025-12-30"
end_date DATE    -- "2026-01-05"

-- Daily uploads
upload_date DATE           -- "2025-12-30"
created_at DATETIME        -- "2025-12-30 04:31:00"
verified_at DATETIME       -- "2025-12-30 05:15:00"

-- Chat messages
created_at DATETIME        -- "2025-12-30 04:31:00"
```

## Common Patterns

### Pattern 1: Get Today's Date
```typescript
const today = formatDateSerbia();  // "2025-12-30"
```

### Pattern 2: Check if Upload is for Today
```typescript
const uploadDate = "2025-12-30";
const today = formatDateSerbia();
if (uploadDate !== today) {
  throw new Error("Can only upload for today");
}
```

### Pattern 3: Calculate Week Boundaries
```typescript
const registrationDate = user.created_at;  // "2025-11-01"
const weekStart = getWeekStartForUser(registrationDate);  // "2025-12-30"
const weekEnd = getWeekEndForUser(weekStart);  // "2026-01-05"
```

### Pattern 4: Add Days to a Date
```typescript
const today = formatDateSerbia();  // "2025-12-30"
const nextWeek = addDaysYMD(today, 7);  // "2026-01-06"
const yesterday = addDaysYMD(today, -1);  // "2025-12-29"
```

### Pattern 5: Calculate Days Between Dates
```typescript
const start = "2025-12-20";
const end = "2025-12-30";
const daysDiff = diffDaysYMD(end, start);  // 10
```

### Pattern 6: Relative Time Calculations (24h ago, 7d ago)
```typescript
// For relative time (not date-specific), using Date.getTime() is acceptable
const nowDate = new Date();
const yesterday24h = new Date(nowDate.getTime() - 24 * 60 * 60 * 1000);
const cutoffTime = formatDateTimeSerbia(yesterday24h);  // "2025-12-29 04:31:00"
```

## Testing Timezone Behavior

### Test Case 1: User in Different Timezone
```typescript
// User in California (UTC-8) at 11:59 PM Dec 29
// Server in Serbia (UTC+1) at 8:59 AM Dec 30
const today = formatDateSerbia();  // "2025-12-30" ✅ Correct
```

### Test Case 2: Week Rollover
```typescript
// User registered on Monday 2025-11-04
// Today is Monday 2025-12-30 (13 weeks later)
const weekStart = getWeekStartForUser("2025-11-04");  // "2025-12-30" ✅
const weekEnd = getWeekEndForUser(weekStart);  // "2026-01-05" ✅
```

### Test Case 3: Streak Calculation
```typescript
// User has uploads on: 2025-12-28, 2025-12-29, 2025-12-30
// Today is 2025-12-30
const streak = recomputeUserStreakFromUploads(userId);
// current_streak = 3 ✅
```

## Anti-Patterns to Avoid

### ❌ **Never Use These**
```typescript
// DON'T: Local timezone methods
new Date().getDate()
new Date().getMonth()
new Date().getFullYear()
date.setDate()
date.setMonth()
date.setFullYear()

// DON'T: ISO string without timezone
new Date().toISOString().split('T')[0]

// DON'T: Date arithmetic with Date objects
const tomorrow = new Date();
tomorrow.setDate(tomorrow.getDate() + 1);

// DON'T: Creating Date objects for business logic
const weekStart = new Date(year, month, day);
```

### ✅ **Always Use These**
```typescript
// DO: Serbia timezone functions
formatDateSerbia()
formatDateTimeSerbia()
addDaysYMD(dateString, days)
diffDaysYMD(dateA, dateB)

// DO: String-based date comparisons
if (uploadDate === formatDateSerbia()) { ... }
if (uploadDate < formatDateSerbia()) { ... }

// DO: String-based date arithmetic
const nextWeek = addDaysYMD(today, 7);
```

## Why This Matters

### Problem Without Timezone Enforcement
1. **User in California uploads at 11:59 PM** → Server thinks it's tomorrow (if using UTC)
2. **Week boundaries shift** → User's week starts on different days depending on server location
3. **Streak calculations break** → Consecutive days appear as gaps due to timezone shifts
4. **Database inconsistency** → Same date stored differently depending on when/where it was created

### Solution With Serbia Timezone
1. **Consistent "today"** → All users and servers agree on what day it is
2. **Predictable weeks** → Week always starts on the same day relative to registration
3. **Accurate streaks** → Consecutive days are correctly identified
4. **Database integrity** → All dates stored in same timezone format

## Migration Notes

If you need to migrate existing data:

```sql
-- All dates should already be in Serbia timezone if created through the app
-- No migration needed for YYYY-MM-DD dates (they're timezone-agnostic)

-- For datetime columns, ensure they're in Serbia timezone:
-- (This is already handled by formatDateTimeSerbia() in the app)
```

## Summary

**Golden Rule**: Use YYYY-MM-DD strings for all date logic. Use Serbia timezone functions for all date operations. Never use JavaScript Date methods for business logic.

This ensures the application behaves consistently regardless of:
- Server location/timezone
- User location/timezone  
- Daylight Saving Time changes
- Database timezone settings
