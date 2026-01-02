# Streak & Trophy System Refactor

## Overview

This document describes the comprehensive refactor of the streak, trophy, and weekly completion systems to establish a single source of truth and eliminate race conditions, conflicting logic, and inconsistent state.

## Files Changed

### New Core Modules

| File | Purpose |
|------|---------|
| `lib/streak-core.ts` | Single source of truth for streak computation |
| `lib/trophy-core.ts` | Single source of truth for trophy/dumbbell management |
| `lib/week-core.ts` | Single source of truth for weekly challenge management |

### Modified Files

| File | Changes |
|------|---------|
| `lib/challenges.ts` | Refactored to delegate to core modules, removed incremental updates |
| `lib/trophies.ts` | Now a backward-compatibility wrapper around trophy-core |
| `app/api/admin/verify-upload/route.ts` | Uses unified `onUploadVerified()` handler |
| `app/api/admin/update-user/route.ts` | Uses new stable baseline logic |

---

## Invariants (Source of Truth)

### Streak Invariants

| Value | Type | Description |
|-------|------|-------------|
| `current_streak` | **DERIVED** | Computed from approved uploads + rest days only |
| `longest_streak` | **STORED** | Maximum historical value, only increases |
| `last_activity_date` | **DERIVED** | Most recent approved upload or rest day |
| `admin_baseline_streak` | **STORED** | Hard floor that never decays |
| `admin_baseline_longest` | **STORED** | Hard floor for longest streak |

**Rules:**
- `current_streak = MAX(computed_consecutive_days, admin_baseline_streak)`
- `longest_streak = MAX(all_historical_values)`
- Only **approved** uploads count (pending = invisible, rejected = invisible)
- Rest days count as valid activity
- Streak recomputed on every verification change

### Trophy Invariants

| Event | Trophy Change | When Applied |
|-------|---------------|--------------|
| Upload approved | +26-32 (deterministic) | On verification |
| Upload rejected | -52-64 (2x base) | On verification |
| Upload pending | **0** | Never |
| Perfect week (7/7 approved) | +10-70 | On week evaluation |
| Missed day | **0** (removed) | Never |

**Rules:**
- Trophies ONLY change on verification or week evaluation
- Weekly bonus only awarded when ALL uploads verified AND 7/7 approved
- Bonuses can be revoked if uploads later rejected
- Trophies never go negative (clamped to 0)

### Weekly Challenge Invariants

| Status | Condition |
|--------|-----------|
| `active` | Current week, may have pending uploads |
| `pending_evaluation` | Week ended but has pending uploads |
| `completed` | 5+ approved + rest days, no pending |
| `failed` | <5 approved + rest days, no pending |

**Rules:**
- Week NOT finalized until all uploads verified
- `completed_days` only counts approved uploads + rest days
- Weekly bonus only on transition to `completed` with 7/7

---

## Issue Resolution Mapping

### Issue #1: Week Boundary Double-Update
**Problem:** Incremental streak added to old value, recompute reset to 1.

**Solution:** 
- Removed all incremental streak updates (`updateStreakOnUpload`, `updateStreakOnRestDay`)
- Single recompute function `computeStreakFromDatabase()` is the only authority
- No streak changes on upload - only on verification

**Code:** `lib/streak-core.ts:67-168`

---

### Issue #2: Purge Race Condition
**Problem:** Async purge could delete uploads before/after recompute.

**Solution:**
- Streak computation no longer depends on old uploads
- Only APPROVED uploads from database are used
- Purge only affects non-pending uploads, correctness unaffected

**Code:** `lib/challenges.ts:166-173`

---

### Issue #3: Auto-Reset on Dashboard Load
**Problem:** `getUserStreak()` had side effects that reset streak to 0.

**Solution:**
- `getUserStreak()` is now pure read with NO side effects
- Streak computed fresh each time from approved uploads
- No mutations in getter functions

**Code:** `lib/challenges.ts:97-109`

---

### Issue #4: Rejected Today Forces Zero
**Problem:** Rejected upload on current day zeroed entire streak.

**Solution:**
- Removed "rejected today = 0" logic
- Rejected uploads are simply invisible to streak calculation
- Streak computed from approved uploads only

**Code:** Removed from `lib/streak-core.ts`

---

### Issue #5: Admin Baseline Decay
**Problem:** Baseline zeroed if date became too old.

**Solution:**
- Admin baseline is now a HARD FLOOR
- `finalCurrent = MAX(computed, admin_baseline_streak)`
- Baseline never decays unless admin explicitly clears it

**Code:** `lib/streak-core.ts:166-196`

---

### Issue #6: Incremental vs Recompute Conflict
**Problem:** Two methods produced different results.

**Solution:**
- Eliminated incremental updates entirely
- Single `computeStreakFromDatabase()` function
- All code paths use the same computation

**Code:** `lib/streak-core.ts:67-168` (single implementation)

---

### Issue #7: Missed Day Penalty on Pending
**Problem:** Penalty applied before verification confirmed validity.

**Solution:**
- **Removed missed day penalties entirely**
- Users simply don't earn trophies for days they miss
- No negative trophy changes for gaps

**Code:** `lib/trophies.ts:33-36` (returns 0)

---

### Issue #8: Weekly Bonus on Pending
**Problem:** Bonus awarded before uploads verified.

**Solution:**
- Week status is `pending_evaluation` if any pending uploads
- Bonus only awarded when status transitions to `completed`
- `challengeQualifiesForBonus()` checks `pendingCount === 0`

**Code:** `lib/trophy-core.ts:136-156`

---

### Issue #9: No Bonus Revocation
**Problem:** Rejected uploads didn't revoke already-awarded bonuses.

**Solution:**
- `syncWeeklyBonus()` is idempotent
- Re-evaluates qualification on every verification
- Awards or revokes as needed

**Code:** `lib/trophy-core.ts:184-199`

---

### Issue #10: Rest Day Penalty
**Problem:** Rest days applied same missed-day penalty as gaps.

**Solution:**
- Missed day penalties removed entirely
- Rest days count as valid activity
- Rest day immediately triggers streak recompute

**Code:** `lib/challenges.ts:309-311`

---

## Execution Flows

### Upload Flow (NEW)
```
User uploads photo
    │
    ▼
getOrCreateActiveChallenge()  ──► Create new week if needed (NO bonus, NO streak)
    │
    ▼
addDailyUpload()  ─────────────► Insert with status='pending'
    │                            NO streak update
    │                            NO trophy change
    ▼
Return success
```

### Verification Flow (NEW)
```
Admin verifies upload
    │
    ▼
verifyUpload()  ───────────────► Update verification_status in DB
    │
    ▼
onUploadVerified()  ───────────► UNIFIED HANDLER:
    │                            1. syncTrophiesForUpload() - idempotent
    │                            2. recomputeAndPersistStreak()
    │                            3. reevaluateChallengeAfterVerification()
    │                            4. Update completed_days
    ▼
Return success
```

### Dashboard Flow (NEW)
```
User requests dashboard
    │
    ▼
getOrCreateActiveChallenge()  ──► Ensure week exists (NO side effects)
    │
    ▼
getChallengeProgress()  ────────► Pure computation
    │
    ▼
getUserStreak()  ───────────────► Pure computation (NO DB writes)
    │
    ▼
getUserTrophies()  ─────────────► Pure read
    │
    ▼
Return data
```

---

## Backward Compatibility

### Deprecated Functions (still work, log warnings)
- `updateStreak()` → calls `recomputeAndPersistStreak()`
- `updateStreakOnUpload()` → NO-OP
- `updateStreakOnRestDay()` → NO-OP
- `trophiesPenaltyForMissedDay()` → returns 0
- `awardWeeklyCompletionBonus()` → calls `syncWeeklyBonus()`

### Migration Notes
- No database schema changes required
- Existing data is compatible
- Admin baselines continue to work (now as hard floors)
- Existing trophy transactions preserved

---

## Remaining Tradeoffs

1. **Pending uploads invisible to streak**: Users won't see streak increment until upload is approved. This is intentional - streak reflects verified activity.

2. **No missed day penalties**: Removed to simplify system. Users simply don't earn trophies for days without approved uploads.

3. **Async purge**: Still async but no longer affects correctness since streak is computed from current DB state.

4. **Week evaluation delay**: Weekly bonus may be delayed if admin is slow to verify. This is correct behavior - bonus should only be awarded for verified perfect weeks.

---

## Testing Scenarios

To verify the refactor, test these scenarios:

1. **Week Boundary**: Complete 7/7 days, start new week, upload first photo
   - Expected: Streak continues from previous week after approval

2. **Verification Toggle**: Approve upload, then reject, then approve again
   - Expected: Trophies correctly adjust (idempotent)

3. **Admin Baseline**: Set baseline to 10, upload one photo, verify it
   - Expected: Streak shows 11 (baseline + 1)

4. **Pending Week**: Complete 7 uploads, don't verify any, start new week
   - Expected: Previous week status = `pending_evaluation`, no bonus yet

5. **Late Rejection**: Complete week, get bonus, then reject 3 uploads
   - Expected: Bonus revoked, streak recalculated

---

## Summary

This refactor establishes a **single source of truth** for all streak and trophy calculations:

- **One function** computes streaks (`computeStreakFromDatabase`)
- **One function** syncs upload trophies (`syncTrophiesForUpload`)
- **One function** syncs weekly bonuses (`syncWeeklyBonus`)
- **One entry point** for verification changes (`onUploadVerified`)

All other code delegates to these functions. No incremental updates. No side effects in getters. No race conditions.
