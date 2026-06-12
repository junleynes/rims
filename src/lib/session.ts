import { getIronSession, IronSession, SessionOptions } from 'iron-session';
import { cookies } from 'next/headers';
import type { Role } from './types';

// Secret is validated at runtime inside getSession(), not at module load,
// so that `next build` (which statically imports modules) does not fail.
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
  // Pending: credentials verified but 2FA not yet confirmed
  pendingUserId?: string;
  loginAttempts?: number;
  lastFailedAt?: number;
}

export async function getSession(): Promise<IronSession<RimsSessionData>> {
  const cookieStore = cookies();
  return getIronSession<RimsSessionData>(cookieStore as any, getSessionOptions());
}

/** Returns the authenticated user or throws a 401-style error */
export async function requireSession(): Promise<SessionUser> {
  const session = await getSession();
  if (!session.user || !session.user.twoFactorVerified) {
    throw new Error('UNAUTHORIZED');
  }
  return session.user;
}

/** Requires Admin role specifically */
export async function requireAdmin(): Promise<SessionUser> {
  const user = await requireSession();
  if (user.role !== 'Admin') {
    throw new Error('FORBIDDEN');
  }
  return user;
}

// Rate limiting: max 5 failed attempts within 15 minutes
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
