import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { checkAdmin } from '@/lib/admin';
import db from '@/lib/db';

function isValidYMD(value: unknown): value is string {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;

    const adminCheck = await checkAdmin(token);
    if (!adminCheck.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await request.json();
    const userId = Number(body.userId);

    if (!Number.isFinite(userId) || userId <= 0) {
      return NextResponse.json({ error: 'Valid userId is required' }, { status: 400 });
    }

    const debt = body.debt;
    const currentStreak = body.current_streak;
    const longestStreak = body.longest_streak;
    const lastActivityDate = body.last_activity_date;

    // Validate numeric fields if present
    const parseNonNegativeInt = (v: unknown) => {
      if (v === undefined || v === null || v === '') return undefined;
      const n = Number(v);
      if (!Number.isFinite(n) || n < 0 || !Number.isInteger(n)) return null;
      return n;
    };

    const debtInt = parseNonNegativeInt(debt);
    const currentInt = parseNonNegativeInt(currentStreak);
    const longestInt = parseNonNegativeInt(longestStreak);

    if (debtInt === null || currentInt === null || longestInt === null) {
      return NextResponse.json({ error: 'Debt/streak values must be non-negative integers' }, { status: 400 });
    }

    if (
      lastActivityDate !== undefined &&
      lastActivityDate !== null &&
      lastActivityDate !== '' &&
      !isValidYMD(lastActivityDate)
    ) {
      return NextResponse.json({ error: 'last_activity_date must be YYYY-MM-DD (or empty)' }, { status: 400 });
    }

    // Ensure user exists
    const user = db.prepare('SELECT id FROM users WHERE id = ?').get(userId) as { id: number } | undefined;
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const tx = db.transaction(() => {
      if (debtInt !== undefined) {
        db.prepare('UPDATE users SET credits = ? WHERE id = ?').run(debtInt, userId);
      }

      const needsStreakUpdate =
        currentInt !== undefined || longestInt !== undefined || lastActivityDate !== undefined;

      if (needsStreakUpdate) {
        // Ensure streak row exists
        db.prepare('INSERT OR IGNORE INTO streaks (user_id, current_streak, longest_streak) VALUES (?, 0, 0)').run(
          userId
        );

        const currentToSet = currentInt !== undefined ? currentInt : undefined;
        const longestToSet = longestInt !== undefined ? longestInt : undefined;
        const lastToSet =
          lastActivityDate === '' || lastActivityDate === null ? null : (lastActivityDate as string | undefined);

        if (currentToSet !== undefined) {
          db.prepare('UPDATE streaks SET current_streak = ? WHERE user_id = ?').run(currentToSet, userId);
        }
        if (longestToSet !== undefined) {
          db.prepare('UPDATE streaks SET longest_streak = ? WHERE user_id = ?').run(longestToSet, userId);
        }
        if (lastActivityDate !== undefined) {
          db.prepare('UPDATE streaks SET last_activity_date = ? WHERE user_id = ?').run(lastToSet, userId);
        }
      }
    });

    tx();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Admin update user error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}


