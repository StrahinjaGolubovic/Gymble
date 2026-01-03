/**
 * trophies.ts - Backward Compatibility Layer
 * 
 * REFACTORED: Core logic moved to trophy-core.ts
 * This file re-exports for backward compatibility.
 * 
 * CHANGES:
 * - Missed day penalty REMOVED (users just don't earn trophies)
 * - All awards/penalties are idempotent via syncTrophiesForUpload
 * - Weekly bonus uses new pending-aware logic from trophy-core
 */

import { logWarning } from './logger';

// Re-export everything from trophy-core
export {
  getUserTrophies,
  applyTrophyDelta,
  syncTrophiesForUpload,
  baseTrophiesForUpload,
  trophiesForApproval,
  trophiesForRejection,
  syncWeeklyBonus,
  adminSetTrophies,
} from './trophy-core';

export type UploadVerifyStatus = 'approved' | 'rejected' | 'pending';

/**
 * Calculate missed day penalty.
 * Returns negative value (trophy loss).
 */
export function trophiesPenaltyForMissedDay(userId: number): number {
  const { trophiesForMissedDay } = require('./trophy-core');
  const { formatDateSerbia } = require('./timezone');
  return trophiesForMissedDay(userId, formatDateSerbia());
}

/**
 * @deprecated Use trophiesForApproval from trophy-core instead
 */
export function trophiesAwardForApproval(userId: number, uploadId: number, uploadDate: string): number {
  const { trophiesForApproval } = require('./trophy-core');
  return trophiesForApproval(uploadId);
}

/**
 * @deprecated Use trophiesForRejection from trophy-core instead
 */
export function trophiesPenaltyForRejection(uploadId: number): number {
  const { trophiesForRejection } = require('./trophy-core');
  return trophiesForRejection(uploadId);
}

/**
 * @deprecated Use syncWeeklyBonus from trophy-core instead.
 * The new implementation properly handles pending uploads.
 */
export function awardWeeklyCompletionBonus(userId: number, challengeId: number): void {
  const { syncWeeklyBonus } = require('./trophy-core');
  syncWeeklyBonus(userId, challengeId);
}

