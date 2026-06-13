import { getIronSession, IronSession, SessionOptions } from 'iron-session';
import { cookies } from 'next/headers';
import type { Role } from './types';

function getSessionOptions(): SessionOptions {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error(
      '[RIMS] SESSION_SECRET environment variable is missing or too short (minimum 32 characters). ' +
      "Generate one with: node -e \"console.log(require('crypto').randomBytes(32).toString('hex'))\" " +
      'and add it to your .env.local file.'
    );
  }
  return {
    password: secret,
    cookieName: 'rims_session',
    cookieOptions: {
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 60 * 60 * 8, // 8 hours
    },
  };
}

export interface SessionUser {
  id: string;
  name: string;
  username: string;
  role: Role;
  division: string;
  section: string;
  twoFactorEnabled: boolean;
  twoFactorVerified: boolean;
  email?: string;
  contactNumber?: string;
  position?: string;
  reportingTo?: string;
  profilePicture?: string;
}

export interface RimsSessionData {
  user?: SessionUser;
  pendingUserId?: string;
  loginAttempts?: number;
  lastFailedAt?: number;
}

export async function getSession(): Promise<IronSession<RimsSessionData>> {
  // In Next.js 15, cookies() returns a Promise — must be awaited so that
  // iron-session receives the actual cookie store object (not a Promise).
  // Without await, cookieStore.set() does not exist and the session is
  // never written, causing the login loop.
  const cookieStore = await cookies();
  return getIronSession<RimsSessionData>(cookieStore as any, getSessionOptions());
}

export async function requireSession(): Promise<SessionUser> {
  const session = await getSession();
  if (!session.user || !session.user.twoFactorVerified) {
    throw new Error('UNAUTHORIZED');
  }
  return session.user;
}

export async function requireAdmin(): Promise<SessionUser> {
  const user = await requireSession();
  if (user.role !== 'Admin') {
    throw new Error('FORBIDDEN');
  }
  return user;
}

export const MAX_ATTEMPTS = 5;
export const LOCKOUT_MS = 15 * 60 * 1000;

export function isLockedOut(session: RimsSessionData): boolean {
  if (!session.loginAttempts || session.loginAttempts < MAX_ATTEMPTS) return false;
  const elapsed = Date.now() - (session.lastFailedAt ?? 0);
  return elapsed < LOCKOUT_MS;
}

export function lockoutRemainingSeconds(session: RimsSessionData): number {
  const elapsed = Date.now() - (session.lastFailedAt ?? 0);
  return Math.ceil((LOCKOUT_MS - elapsed) / 1000);
}
