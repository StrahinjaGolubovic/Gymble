import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { checkAdmin } from '@/lib/admin';
import db from '@/lib/db';
import { hashPassword } from '@/lib/auth';
import crypto from 'crypto';

function generateTempPassword(length = 14): string {
  // URL-safe, no confusing characters requirement not specified; keep it simple.
  return crypto.randomBytes(Math.ceil(length)).toString('base64url').slice(0, length);
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
    const newPasswordInput = body.newPassword as unknown;

    if (!Number.isFinite(userId) || userId <= 0) {
      return NextResponse.json({ error: 'Valid userId is required' }, { status: 400 });
    }

    // Ensure user exists
    const user = db.prepare('SELECT id, username FROM users WHERE id = ?').get(userId) as
      | { id: number; username: string }
      | undefined;
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const newPassword =
      typeof newPasswordInput === 'string' && newPasswordInput.trim().length > 0
        ? newPasswordInput.trim()
        : generateTempPassword();

    if (newPassword.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 });
    }

    if (!/[a-zA-Z]/.test(newPassword) || !/[0-9]/.test(newPassword)) {
      return NextResponse.json({ 
        error: 'Password must contain at least one letter and one number' 
      }, { status: 400 });
    }

    const passwordHash = await hashPassword(newPassword);
    db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(passwordHash, userId);

    // We return the NEW password (temp or provided) since we cannot reveal existing passwords.
    return NextResponse.json({
      success: true,
      userId,
      username: user.username,
      newPassword,
      temporary: typeof newPasswordInput !== 'string' || newPasswordInput.trim().length === 0,
    });
  } catch (error) {
    console.error('Admin reset user password error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}


