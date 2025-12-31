import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import db from './db';

// Validate JWT_SECRET at module load in production runtime
// Allow missing during build and development
const JWT_SECRET = process.env.JWT_SECRET;

// Defer validation to runtime - only check when getJwtSecret() is actually called
// This allows builds to succeed while still enforcing the requirement in production

// Get JWT_SECRET with runtime validation
function getJwtSecret(): string {
  if (!JWT_SECRET) {
    // In production, this is a fatal error
    if (process.env.NODE_ENV === 'production') {
      throw new Error('FATAL: JWT_SECRET environment variable must be set in production');
    }
    throw new Error('CRITICAL: JWT_SECRET environment variable must be set');
  }
  return JWT_SECRET;
}

export interface User {
  id: number;
  username: string;
  credits: number;
  profile_picture: string | null;
  created_at: string;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function generateToken(userId: number): string {
  return jwt.sign({ userId }, getJwtSecret(), { expiresIn: '7d' });
}

export function verifyToken(token: string): { userId: number } | null {
  try {
    return jwt.verify(token, getJwtSecret()) as { userId: number };
  } catch {
    return null;
  }
}

export function getUserById(id: number): User | null {
  const user = db.prepare('SELECT id, username, credits, profile_picture, created_at FROM users WHERE id = ?').get(id) as User | undefined;
  return user || null;
}

export function getUserByUsername(username: string): (User & { password_hash: string }) | null {
  const user = db
    .prepare('SELECT id, username, password_hash, credits, profile_picture, created_at FROM users WHERE username = ?')
    .get(username) as (User & { password_hash: string }) | undefined;
  return user || null;
}

