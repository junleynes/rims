'use server';

import bcrypt from 'bcryptjs';
import { authenticator } from 'otplib';
import QRCode from 'qrcode';
import * as db from '@/lib/server-db';
import {
  getSession,
  requireSession,
  requireAdmin,
  isLockedOut,
  lockoutRemainingSeconds,
  MAX_ATTEMPTS,
  type SessionUser,
} from '@/lib/session';
import type { Role } from '@/lib/types';

// ── Login ──────────────────────────────────────────────────────────────────

export async function actionLogin(
  username: string,
  password: string
): Promise<
  | { status: 'locked'; remainingSeconds: number }
  | { status: 'invalid' }
  | { status: 'maintenance' }
  | { status: 'needs_2fa_setup'; qrCodeUrl: string; secret: string }
  | { status: 'needs_2fa_verify' }
  | { status: 'ok'; user: SessionUser }
> {
  const session = await getSession();

  // Rate limiting
  if (isLockedOut(session)) {
    return { status: 'locked', remainingSeconds: lockoutRemainingSeconds(session) };
  }

  if (!username || !password) return { status: 'invalid' };

  const record = await db.getUserByUsername(username);
  const validPassword =
    record &&
    !record.isStaffOnly &&
    record.password_hash &&
    bcrypt.compareSync(password, record.password_hash);

  if (!validPassword) {
    session.loginAttempts = (session.loginAttempts ?? 0) + 1;
    session.lastFailedAt = Date.now();
    await session.save();
    return { status: 'invalid' };
  }

  // Enforce maintenance mode here, server-side, before any session or 2FA
  // pending state is created. This must not rely on the client (the login
  // page previously only checked this after the session was already
  // established, using a stale value of `user` that never reflected the
  // freshly-logged-in account — so the block silently never fired).
  if (db.getMaintenanceModeSync() && record.role !== 'Admin') {
    return { status: 'maintenance' };
  }

  // Reset failed attempts on success
  session.loginAttempts = 0;
  session.lastFailedAt = undefined;

  const needs2FASetup = !!record.twoFactorEnabled && !record.twoFactorSecret;

  // If 2FA is enabled and already set up → store pending, require OTP
  if (record.twoFactorEnabled && record.twoFactorSecret) {
    session.pendingUserId = record.id;
    await session.save();
    return { status: 'needs_2fa_verify' };
  }

  // If 2FA forced setup required → generate QR, store pending
  if (needs2FASetup) {
    const secret = authenticator.generateSecret();
    const otpauth = authenticator.keyuri(record.username || record.name, 'R.I.M.S', secret);
    const qrCodeUrl = await QRCode.toDataURL(otpauth);
    session.pendingUserId = record.id;
    // Store temp secret in session until confirmed
    (session as any).__pendingSecret = secret;
    await session.save();
    return { status: 'needs_2fa_setup', qrCodeUrl, secret };
  }

  // No 2FA — log in directly
  const sessionUser = buildSessionUser(record);
  session.user = { ...sessionUser, twoFactorVerified: true };
  session.pendingUserId = undefined;
  await session.save();
  return { status: 'ok', user: session.user };
}

// ── Verify 2FA code at login ───────────────────────────────────────────────

export async function actionVerify2FA(
  code: string
): Promise<{ success: boolean; user?: SessionUser; error?: string }> {
  const session = await getSession();
  const pendingId = session.pendingUserId;
  if (!pendingId) return { success: false, error: 'No pending session.' };

  const record = await db.getUserById(pendingId);
  if (!record || !record.twoFactorSecret) return { success: false, error: 'User not found.' };

  const valid = authenticator.verify({ token: code, secret: record.twoFactorSecret });
  if (!valid) return { success: false, error: 'Invalid code.' };

  const sessionUser = buildSessionUser(record);
  session.user = { ...sessionUser, twoFactorVerified: true };
  session.pendingUserId = undefined;
  await session.save();
  return { success: true, user: session.user };
}

// ── Confirm forced 2FA setup ───────────────────────────────────────────────

export async function actionConfirmSetup2FA(
  code: string,
  secret: string
): Promise<{ success: boolean; user?: SessionUser; error?: string }> {
  const session = await getSession();
  const pendingId = session.pendingUserId;
  if (!pendingId) return { success: false, error: 'No pending session.' };

  const valid = authenticator.verify({ token: code, secret });
  if (!valid) return { success: false, error: 'Invalid code. Try again.' };

  await db.updateTwoFactor(pendingId, true, secret);
  const record = await db.getUserById(pendingId);
  if (!record) return { success: false, error: 'User not found.' };

  const sessionUser = buildSessionUser(record);
  session.user = { ...sessionUser, twoFactorVerified: true };
  session.pendingUserId = undefined;
  await session.save();
  return { success: true, user: session.user };
}

// ── Logout ────────────────────────────────────────────────────────────────

export async function actionLogout(): Promise<void> {
  const session = await getSession();
  session.destroy();
}

// ── Get current session user (for client bootstrap) ───────────────────────

export async function actionGetSession(): Promise<SessionUser | null> {
  try {
    const user = await requireSession();
    return user;
  } catch {
    return null;
  }
}

// ── Change password (self) ─────────────────────────────────────────────────

export async function actionChangePassword(
  currentPassword: string,
  newPassword: string
): Promise<{ success: boolean; error?: string }> {
  const sessionUser = await requireSession();

  if (newPassword.length < 8) {
    return { success: false, error: 'Password must be at least 8 characters.' };
  }

  const record = await db.getUserById(sessionUser.id);
  if (!record?.password_hash) return { success: false, error: 'User not found.' };

  const match = bcrypt.compareSync(currentPassword, record.password_hash);
  if (!match) return { success: false, error: 'Current password is incorrect.' };

  const hash = bcrypt.hashSync(newPassword, 12);
  await db.updateUserPassword(sessionUser.id, hash);
  return { success: true };
}

// ── Admin: disable 2FA for a user ─────────────────────────────────────────

export async function actionAdminDisable2FA(
  userId: string
): Promise<{ success: boolean }> {
  await requireAdmin();
  await db.updateTwoFactor(userId, false, null);
  return { success: true };
}

// ── Setup 2FA from profile page ───────────────────────────────────────────

export async function actionSetupTwoFactor(): Promise<{ secret: string; qrCodeUrl: string }> {
  const sessionUser = await requireSession();
  const record = await db.getUserById(sessionUser.id);
  if (!record) throw new Error('User not found');

  const secret = authenticator.generateSecret();
  const otpauth = authenticator.keyuri(record.username || record.name, 'R.I.M.S', secret);
  const qrCodeUrl = await QRCode.toDataURL(otpauth);
  return { secret, qrCodeUrl };
}

export async function actionConfirmTwoFactor(
  code: string,
  secret: string
): Promise<{ success: boolean; error?: string }> {
  const sessionUser = await requireSession();
  const valid = authenticator.verify({ token: code, secret });
  if (!valid) return { success: false, error: 'Invalid code.' };
  await db.updateTwoFactor(sessionUser.id, true, secret);
  return { success: true };
}

export async function actionDisableTwoFactor(): Promise<{ success: boolean }> {
  const sessionUser = await requireSession();
  await db.updateTwoFactor(sessionUser.id, false, null);
  return { success: true };
}

// ── Helper ─────────────────────────────────────────────────────────────────

function buildSessionUser(record: any): Omit<SessionUser, 'twoFactorVerified'> {
  return {
    id: record.id,
    name: record.name,
    username: record.username,
    role: (record.role ?? 'Viewer') as Role,
    division: record.division ?? '',
    section: record.section ?? '',
    twoFactorEnabled: !!record.twoFactorEnabled,
    email: record.email ?? undefined,
    contactNumber: record.contactNumber ?? undefined,
    position: record.position ?? undefined,
    reportingTo: record.reportingTo ?? undefined,
    profilePicture: record.profilePicture ?? undefined,
  };
}
