
'use server';

import * as db from '@/lib/server-db';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { authenticator } from 'otplib';
import QRCode from 'qrcode';
import { BudgetEntry, User, Division, Section, Location, StatusOption, BrandingConfig, SystemConfig, Position, SmtpConfig, SystemUpdate, KnowledgeBaseEntry } from '@/lib/types';

// Strict validation schemas with permissive empty-string handling
const BudgetEntrySchema = z.object({
  id: z.string(),
  year: z.number().int(),
  division: z.string(),
  section: z.string(),
  location: z.string(),
  locationDetails: z.string().optional().nullable().transform(v => v === '' ? undefined : v),
  classification: z.enum(['Hardware', 'Software', 'Others']),
  category: z.enum(['CAPEX', 'OPEX']),
  account: z.string(),
  projectTitle: z.string().min(1),
  itemDescription: z.string(),
  quantity: z.number().int().min(1),
  unitCostBudget: z.number().min(0),
  totalCostBudget: z.number(),
  unitCostActual: z.number().optional().nullable().default(0),
  totalCostActual: z.number().optional().nullable().default(0),
  prNumber: z.string().optional().nullable().transform(v => v === '' ? undefined : v),
  dateDelivered: z.string().optional().nullable().transform(v => v === '' ? undefined : v),
  grSisNumber: z.string().optional().nullable().transform(v => v === '' ? undefined : v),
  accountablePerson: z.string().optional().nullable().transform(v => v === '' ? undefined : v),
  status: z.string(),
  statusOthers: z.string().optional().nullable().transform(v => v === '' ? undefined : v),
  remarks: z.string().optional().nullable().default(''),
  attachments: z.array(z.string()).optional().default([]),
  createdAt: z.string(),
});

const UserSchema = z.object({
  id: z.string(),
  username: z.preprocess(v => (v === '' || v === null) ? undefined : v, z.string().optional()),
  name: z.string().min(1),
  email: z.preprocess(v => (v === '' || v === null) ? undefined : v, z.string().email().optional()),
  contactNumber: z.preprocess(v => (v === '' || v === null) ? undefined : v, z.string().optional()),
  role: z.enum(['Admin', 'Manager', 'AVP', 'VP', 'Viewer']).nullable().optional(),
  section: z.preprocess(v => (v === '' || v === null) ? undefined : v, z.string().optional()),
  division: z.preprocess(v => (v === '' || v === null) ? undefined : v, z.string().optional()),
  twoFactorEnabled: z.preprocess(v => !!v, z.boolean()),
  twoFactorSecret: z.string().optional().nullable(),
  position: z.preprocess(v => (v === '' || v === null) ? undefined : v, z.string().optional()),
  reportingTo: z.preprocess(v => (v === '' || v === null) ? undefined : v, z.string().optional()),
  isStaffOnly: z.preprocess(v => !!v, z.boolean()),
  profilePicture: z.preprocess(v => (v === '' || v === null) ? undefined : v, z.string().optional()),
});

const SystemUpdateSchema = z.object({
  id: z.string(),
  title: z.string().min(1),
  content: z.string().min(1),
  type: z.enum(['Info', 'Alert', 'Feature']),
  createdBy: z.string(),
  createdAt: z.string(),
});

const KnowledgeBaseEntrySchema = z.object({
  id: z.string(),
  title: z.string().min(1),
  description: z.string(),
  fileName: z.string(),
  fileType: z.string(),
  fileData: z.string(),
  uploadedBy: z.string(),
  createdAt: z.string(),
});

export async function getBudgets() {
  return db.getAllResources();
}

export async function saveBudgets(budgets: BudgetEntry[]) {
  const validated = budgets.map(b => BudgetEntrySchema.parse(b));
  await db.saveResources(validated);
}

export async function clearYearData(year: number) {
  await db.deleteResourcesByYear(year);
  return true;
}

export async function fetchSystemUpdates() {
  return db.getAllSystemUpdates();
}

export async function saveSystemUpdates(updates: SystemUpdate[]) {
  const validated = updates.map(u => SystemUpdateSchema.parse(u));
  await db.saveSystemUpdates(validated);
}

export async function fetchKnowledgeBaseEntries() {
  return db.getAllKnowledgeBaseEntries();
}

export async function createKnowledgeBaseEntry(entry: KnowledgeBaseEntry) {
  const validated = KnowledgeBaseEntrySchema.parse(entry);
  await db.saveKnowledgeBaseEntry(validated);
  return true;
}

export async function removeKnowledgeBaseEntry(id: string) {
  await db.deleteKnowledgeBaseEntry(id);
  return true;
}

export async function getSystemData() {
  const [divisions, sections, locations, statusOptions, users, branding, positions, systemConfig] = await Promise.all([
    db.getAllDivisions(),
    db.getAllSections(),
    db.getAllLocations(),
    db.getAllStatusOptions(),
    db.getAllUsers(),
    db.getBranding(),
    db.getAllPositions(),
    db.getSystemConfig()
  ]);

  return {
    divisions,
    sections,
    locations,
    statusOptions,
    users,
    branding,
    positions,
    systemConfig
  };
}

export async function saveSystemData(update: {
  divisions?: Division[],
  sections?: Section[],
  locations?: Location[],
  statusOptions?: StatusOption[],
  users?: User[],
  branding?: BrandingConfig,
  positions?: Position[],
  systemConfig?: SystemConfig
}) {
  if (update.divisions) await db.saveDivisions(update.divisions);
  if (update.sections) await db.saveSections(update.sections);
  if (update.locations) await db.saveLocations(update.locations);
  if (update.statusOptions) await db.saveStatusOptions(update.statusOptions);
  
  if (update.users) {
    const validatedUsers = update.users.map(u => UserSchema.parse(u));
    await db.saveUsers(validatedUsers);
  }
  
  if (update.branding) await db.saveBranding(update.branding);
  if (update.positions) await db.savePositions(update.positions);
  if (update.systemConfig) await db.saveSystemConfig(update.systemConfig);
  
  return true;
}

export async function verifyUserCredentials(username: string, password?: string) {
  if (!username || !password) return null;

  try {
    const userRecord = await db.getUserByUsername(username);
    if (!userRecord || userRecord.isStaffOnly || !userRecord.password_hash) return null;

    const isPasswordValid = bcrypt.compareSync(password, userRecord.password_hash);
    
    if (isPasswordValid) {
      const needs2FASetup = !!userRecord.twoFactorEnabled && !userRecord.twoFactorSecret;
      
      return {
        id: userRecord.id,
        username: userRecord.username,
        name: userRecord.name,
        email: userRecord.email,
        contactNumber: userRecord.contactNumber,
        role: userRecord.role as any,
        section: userRecord.section,
        division: userRecord.division,
        twoFactorEnabled: !!userRecord.twoFactorEnabled,
        twoFactorSecret: userRecord.twoFactorSecret || undefined,
        position: userRecord.position,
        reportingTo: userRecord.reportingTo,
        profilePicture: userRecord.profilePicture,
        needs2FASetup: needs2FASetup
      } as User;
    }
  } catch (err) {
    console.error('Credential verification error:', err);
  }

  return null;
}

export async function fetchSmtpConfig() {
  return db.getSmtpConfig();
}

export async function updateSmtpConfig(config: SmtpConfig) {
  await db.saveSmtpConfig(config);
  return true;
}

export async function resetUserPassword(userId: string, newPassword: string) {
  const hash = bcrypt.hashSync(newPassword, 10);
  await db.updateUserPassword(userId, hash);
  return { success: true };
}

// --- TOTP 2FA Actions ---
export async function setupTwoFactor(userId: string) {
  const user = await db.getUserById(userId);
  if (!user) throw new Error("User not found");
  
  const secret = authenticator.generateSecret();
  const otpauth = authenticator.keyuri(user.username || user.name, 'R.I.M.S', secret);
  const qrCodeUrl = await QRCode.toDataURL(otpauth);
  
  return { secret, qrCodeUrl };
}

export async function confirmTwoFactor(userId: string, code: string, secret: string) {
  const isValid = authenticator.verify({ token: code, secret });
  if (isValid) {
    await db.updateTwoFactor(userId, true, secret);
    return { success: true };
  }
  return { success: false, message: "Invalid verification code. Please try again." };
}

export async function disableTwoFactor(userId: string) {
  await db.updateTwoFactor(userId, false, null);
  return { success: true };
}

export async function verifyLogin2FA(userId: string, code: string) {
  const user = await db.getUserById(userId);
  if (!user || !user.twoFactorSecret) return false;
  
  return authenticator.verify({ token: code, secret: user.twoFactorSecret });
}
