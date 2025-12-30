# Comprehensive Timezone & Date/Time Audit Report

## Executive Summary

**Critical Issues Found: 3**
**Medium Issues Found: 2**
**Low Issues Found: 1**

---

## 🚨 CRITICAL ISSUE #1: SQLite CURRENT_TIMESTAMP Uses UTC, Not Serbia Time

### Problem
All database tables use `DEFAULT CURRENT_TIMESTAMP` which stores **UTC time**, not Serbia time. This creates a fundamental timezone mismatch throughout the application.

### Affected Tables
- `rest_days` (created_at)
- `weekly_challenges` (created_at)
- `daily_uploads` (created_at, verified_at)
- `trophy_transactions` (created_at)
- `invite_codes` (created_at)
- `friends` (created_at)
- `chat_messages` (created_at)
- `crews` (created_at, tag_updated_at)
- `crew_members` (joined_at)
- `crew_requests` (created_at)
- `crew_chat_messages` (created_at)
- `notifications` (created_at)
- `nudges` (created_at)
- `feedback` (created_at)
- `app_settings` (updated_at)

### Impact
- **Timestamps are off by 1-2 hours** depending on DST
- When displaying "created 5 minutes ago", it might show "created 1 hour 5 minutes ago"
- Sorting by time is incorrect
- Time-based queries return wrong results

### Current Workaround
Code manually calls `formatDateTimeSerbia()` for most inserts, but some tables still rely on DEFAULT CURRENT_TIMESTAMP.

### Solution Required
**Option A (Recommended):** Remove all `DEFAULT CURRENT_TIMESTAMP` and always explicitly pass Serbia time
**Option B:** Keep defaults but document that all timestamps are UTC and convert on read

---

## 🚨 CRITICAL ISSUE #2: Week Boundary Calculation at Midnight

### Problem
Week start/end dates are calculated using `formatDateSerbia()` which can have edge cases around midnight during DST transitions.

### Location
`lib/challenges.ts:223-234` - `getWeekStartEnd()`

### Scenario
At 00:00:00 during DST transition (spring forward or fall back), the date calculation might be off by one day.

### Code
```typescript
const currentDateStr = currentDate ? formatDateSerbia(currentDate) : formatDateSerbia();
```

### Impact
- User might get wrong week assigned
- Week might start on Tuesday instead of Monday
- Challenges could span 6 or 8 days instead of 7

### Solution Required
Use explicit UTC-based date arithmetic for week calculations, not timezone-dependent formatting.

---

## 🚨 CRITICAL ISSUE #3: Upload Date Mismatch Between Client and Server

### Problem
Upload date is sent from **client** but validated/stored on **server**. If client is in different timezone or has wrong system time, dates won't match.

### Location
Upload flow: client sends `upload_date` → server stores it

### Scenario
1. User in USA (UTC-5) uploads at 11 PM local time
2. Client sends `upload_date: "2025-12-31"` (their local date)
3. Server in Serbia (UTC+1) receives at 5 AM next day
4. Server thinks it's `"2026-01-01"` but stores client's `"2025-12-31"`
5. Streak calculation breaks because dates don't match server's "today"

### Impact
- Streak breaks unexpectedly
- Users can't upload "today" because server thinks it's tomorrow
- Challenge day tracking is inconsistent

### Solution Required
**Server should always determine the upload date**, not trust client.

---

## ⚠️ MEDIUM ISSUE #1: Inconsistent Date Comparison Methods

### Problem
Multiple ways to compare dates exist in codebase:
1. String comparison: `dateString < today`
2. `diffDaysYMD()` function
3. `isTodaySerbia()` function
4. Direct Date object comparison

### Locations
- `lib/challenges.ts` - multiple comparison methods
- `lib/timezone.ts` - `isPastSerbia()` uses string comparison
- Various API routes

### Impact
- Confusing for developers
- Easy to introduce bugs
- Hard to maintain

### Solution Required
Standardize on ONE method for date comparisons.

---

## ⚠️ MEDIUM ISSUE #2: parseSerbiaDate() Fallback is Dangerous

### Problem
`parseSerbiaDate()` has a fallback that calls `new Date(dateString)` for unknown formats. This can create invalid dates.

### Location
`lib/timezone.ts:98`

```typescript
// Fallback for other formats
return new Date(dateString);
```

### Impact
- Silent failures for malformed dates
- "Invalid Date" errors in production
- Hard to debug

### Solution Required
Throw error or return null for invalid formats instead of creating potentially invalid Date objects.

---

## ℹ️ LOW ISSUE #1: No Validation for Date String Formats

### Problem
Functions accept date strings but don't validate format before processing.

### Locations
- `addDaysYMD()`
- `diffDaysYMD()`
- `formatDateDisplay()`
- etc.

### Impact
- Runtime errors if wrong format passed
- Hard to debug

### Solution Required
Add format validation at function entry points.

---

## Edge Cases to Test

### 1. Daylight Saving Time Transitions
- **Spring Forward:** 2 AM → 3 AM (missing hour)
- **Fall Back:** 2 AM → 1 AM (repeated hour)
- Test uploads at 01:59, 02:00, 02:01 on transition days

### 2. Midnight Boundary
- Upload at 23:59:59
- Upload at 00:00:00
- Upload at 00:00:01
- Verify correct day assignment

### 3. Week Boundaries
- Sunday 23:59:59 → Monday 00:00:00
- Verify new week starts correctly
- Check challenge rollover

### 4. Month/Year Boundaries
- December 31 → January 1
- Verify date arithmetic doesn't break

### 5. Leap Year
- February 28 → February 29 (leap year)
- February 28 → March 1 (non-leap year)

### 6. User in Different Timezone
- User travels to different timezone
- System time is wrong
- User manually changes device time

---

## Recommendations

### Immediate Actions (Critical)
1. **Remove all `DEFAULT CURRENT_TIMESTAMP`** - Always pass explicit Serbia time
2. **Server determines upload dates** - Never trust client date
3. **Fix week boundary calculation** - Use UTC-based arithmetic

### Short-term Actions (Medium Priority)
4. Standardize date comparison methods
5. Remove dangerous fallback in `parseSerbiaDate()`
6. Add comprehensive timezone tests

### Long-term Actions (Low Priority)
7. Add date format validation
8. Document timezone handling strategy
9. Consider using a date library (date-fns, luxon) for consistency

---

## Testing Checklist

- [ ] Upload at midnight (00:00:00)
- [ ] Upload during DST transition
- [ ] Week rollover on Sunday/Monday boundary
- [ ] Month rollover (Dec 31 → Jan 1)
- [ ] Leap year handling
- [ ] User with wrong system time
- [ ] User in different timezone
- [ ] Streak calculation across week boundary
- [ ] Rest day at week boundary
- [ ] Nudge at midnight
- [ ] Notification timestamps
- [ ] Chat message timestamps
- [ ] Crew tag expiration (48 hours)
- [ ] Chat message cleanup (24 hours)

---

## Root Cause Analysis

**Why do timezone errors keep happening?**

1. **Mixed Responsibility:** Some timestamps come from SQLite (UTC), others from application code (Serbia time)
2. **No Single Source of Truth:** Date/time can be determined by client, server, or database
3. **Implicit Assumptions:** Code assumes dates are in Serbia timezone but doesn't enforce it
4. **No Validation:** Invalid dates can propagate through the system
5. **Complex Edge Cases:** Midnight, DST, week boundaries are not explicitly tested

**The Fix:**
- **Server is the source of truth** for all dates/times
- **Explicit Serbia time** for all database writes
- **Consistent date arithmetic** using UTC-based calculations
- **Comprehensive edge case testing**
