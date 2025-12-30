import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import db from './db';

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error('CRITICAL: JWT_SECRET environment variable must be set');
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
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '7d' });
}

export function verifyToken(token: string): { userId: number } | null {
  try {
    return jwt.verify(token, JWT_SECRET) as { userId: number };
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

