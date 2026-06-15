'use server';

import * as db from '@/lib/server-db';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import nodemailer from 'nodemailer';
import { BudgetEntry, User, Division, Section, Location, StatusOption, BrandingConfig, SystemConfig, Position, SmtpConfig, SystemUpdate, KnowledgeBaseEntry, LockedYear } from '@/lib/types';
import { requireSession, requireAdmin } from '@/lib/session';

// Strict validation schemas with permissive empty-string handling
const BudgetEntrySchema = z.object({
  id: z.string(),
  year: z.number().int(),
  division: z.string(),
  section: z.string(),
  location: z.string(),
  locationDetails: z.string().optional().nullable().transform(v => (v === '' || v === null) ? undefined : v),
  classification: z.enum(['Hardware', 'Software', 'Others']),
  category: z.enum(['CAPEX', 'OPEX']),
  account: z.enum([
    'Capex',
    'Seminars and Trainings - online or face to face',
    'Seminars and Trainings - Subscriptions/Annual Renewal',
    'Repairs and Maintenance - one time purchase',
    'Repairs and Maintenance - Subscriptions/Annual Renewal',
    'Miscellaneous - Perpetual',
    'Miscellaneous - Subscriptions/Annual Renewal',
    'Office Supplies',
  ]),
  projectTitle: z.string().min(1),
  itemDescription: z.string(),
  quantity: z.number().int().min(1),
  unitCostBudget: z.number().min(0),
  totalCostBudget: z.number(),
  unitCostActual: z.number().optional().nullable().transform(v => v ?? undefined),
  totalCostActual: z.number().optional().nullable().transform(v => v ?? undefined),
  prNumber: z.string().optional().nullable().transform(v => (v === '' || v === null) ? undefined : v),
  dateDelivered: z.string().optional().nullable().transform(v => (v === '' || v === null) ? undefined : v),
  grSisNumber: z.string().optional().nullable().transform(v => (v === '' || v === null) ? undefined : v),
  accountablePerson: z.string().optional().nullable().transform(v => (v === '' || v === null) ? undefined : v),
  status: z.string(),
  statusOthers: z.string().optional().nullable().transform(v => (v === '' || v === null) ? undefined : v),
  remarks: z.string().optional().nullable().transform(v => v ?? ''),
  attachments: z.array(z.string()).optional().default([]),
  createdAt: z.string(),
});

const UserSchema = z.object({
  id: z.string(),
  username: z.preprocess(v => (v === '' || v === null) ? undefined : v, z.string().optional()),
  name: z.string().min(1),
  email: z.preprocess(v => (v === '' || v === null) ? undefined : v, z.string().email().optional()),
  contactNumber: z.preprocess(v => (v === '' || v === null) ? undefined : v, z.string().optional()),
  role: z.enum(['Admin', 'Manager', 'AVP', 'VP', 'Viewer']).nullable().optional().transform(v => v ?? undefined),
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
  filePath: z.string(),
  uploadedBy: z.string(),
  createdAt: z.string(),
});

export async function getBudgets() {
  return db.getAllResources();
}

export async function saveBudgets(budgets: BudgetEntry[]) {
  await requireSession();
  const validated = budgets.map(b => BudgetEntrySchema.parse(b));
  await db.saveResources(validated);
}

export async function clearYearData(year: number) {
  await requireAdmin();
  await db.deleteResourcesByYear(year);
  return true;
}

export async function fetchSystemUpdates() {
  return db.getAllSystemUpdates();
}

export async function saveSystemUpdates(updates: SystemUpdate[]) {
  await requireAdmin();
  const validated = updates.map(u => SystemUpdateSchema.parse(u));
  await db.saveSystemUpdates(validated);
}

export async function fetchKnowledgeBaseEntries() {
  return db.getAllKnowledgeBaseEntries();
}

export async function createKnowledgeBaseEntry(entry: KnowledgeBaseEntry) {
  await requireSession();
  const validated = KnowledgeBaseEntrySchema.parse(entry);
  await db.saveKnowledgeBaseEntry(validated);
  return true;
}

export async function removeKnowledgeBaseEntry(id: string) {
  await requireSession();
  await db.deleteKnowledgeBaseEntry(id);
  return true;
}

export async function getSystemData() {
  const [divisions, sections, locations, statusOptions, users, branding, positions, systemConfig, lockedYears] = await Promise.all([
    db.getAllDivisions(),
    db.getAllSections(),
    db.getAllLocations(),
    db.getAllStatusOptions(),
    db.getAllUsers(),
    db.getBranding(),
    db.getAllPositions(),
    db.getSystemConfig(),
    db.getAllLockedYears()
  ]);

  return {
    divisions,
    sections,
    locations,
    statusOptions,
    users,
    branding,
    positions,
    systemConfig,
    lockedYears
  };
}

export async function saveSystemData(update: {  divisions?: Division[],
  sections?: Section[],
  locations?: Location[],
  statusOptions?: StatusOption[],
  users?: User[],
  branding?: BrandingConfig,
  positions?: Position[],
  systemConfig?: SystemConfig,
  lockedYears?: LockedYear[]
}) {
  await requireAdmin();
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
  if (update.lockedYears) await db.saveLockedYears(update.lockedYears);
  
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
  await requireAdmin();
  await db.saveSmtpConfig(config);
  return true;
}

export async function testSmtpConnection(config: SmtpConfig, targetEmail: string) {
  await requireAdmin();
  const transporter = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: {
      user: config.user,
      pass: config.pass,
    },
  });

  try {
    await transporter.verify();
    await transporter.sendMail({
      from: {
        name: config.fromName || 'R.I.M.S. Notifications',
        address: config.fromEmail,
      },
      to: targetEmail,
      subject: 'R.I.M.S SMTP Connection Test',
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
          <h2 style="color: #2E86AB;">SMTP Connection Test</h2>
          <p>Hello,</p>
          <p>This is a test email confirming that your SMTP configuration for the <strong>Resource Inventory Management System (R.I.M.S)</strong> is working correctly.</p>
          <div style="background: #f8fafc; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0;"><strong>Sent To:</strong> ${targetEmail}</p>
            <p style="margin: 5px 0 0 0;"><strong>Timestamp:</strong> ${new Date().toLocaleString()}</p>
          </div>
          <p>If you received this, your email infrastructure is ready for system notifications.</p>
          <p style="margin-top: 30px; font-size: 12px; color: #64748b;">This is an automated test message.</p>
        </div>
      `,
    });
    return { success: true };
  } catch (error: any) {
    console.error('SMTP Test Error:', error);
    return { success: false, message: error.message || 'Unknown SMTP error occurred.' };
  }
}

export async function emailUserCredentials(userId: string) {
  await requireAdmin();
  const smtp = await db.getSmtpConfig();
  if (!smtp || !smtp.host) {
    return { success: false, message: "SMTP is not configured. Please go to System Settings." };
  }

  const user = await db.getUserById(userId);
  if (!user || !user.email) {
    return { success: false, message: "User email not found or user does not exist." };
  }

  // Generate random temporary password
  const tempPassword = Math.random().toString(36).substring(2, 10);
  const hash = bcrypt.hashSync(tempPassword, 10);

  // Update password in DB
  await db.updateUserPassword(userId, hash);

  const transporter = nodemailer.createTransport({
    host: smtp.host,
    port: smtp.port,
    secure: smtp.secure,
    auth: {
      user: smtp.user,
      pass: smtp.pass,
    },
  });

  try {
    await transporter.sendMail({
      from: {
        name: smtp.fromName || 'R.I.M.S. Notifications',
        address: smtp.fromEmail,
      },
      to: user.email,
      subject: 'R.I.M.S Account Credentials - Password Reset',
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
          <h2 style="color: #2E86AB;">Account Access Information</h2>
          <p>Hello <strong>${user.name}</strong>,</p>
          <p>Your password for the <strong>Resource Inventory Management System (R.I.M.S)</strong> has been reset by an administrator.</p>
          <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0; border: 1px dashed #2E86AB; text-align: center;">
            <p style="margin: 0; color: #64748b; font-size: 14px;">Username:</p>
            <p style="margin: 5px 0 15px 0; font-weight: bold; font-size: 18px;">${user.username}</p>
            <p style="margin: 0; color: #64748b; font-size: 14px;">Temporary Password:</p>
            <p style="margin: 5px 0 0 0; font-weight: bold; font-size: 24px; color: #E03E1A; letter-spacing: 2px; font-family: monospace;">${tempPassword}</p>
          </div>
          <p>Please log in and change your password immediately in your profile settings.</p>
          <p style="margin-top: 30px; font-size: 12px; color: #64748b;">This is an automated notification. For security reasons, do not share this email. Please do not reply directly to this email.</p>
        </div>
      `,
    });
    return { success: true };
  } catch (error: any) {
    console.error('Email Dispatch Error:', error);
    return { success: false, message: error.message || 'Failed to dispatch email.' };
  }
}

export async function resetUserPassword(userId: string, newPassword: string) {
  await requireAdmin();
  const hash = bcrypt.hashSync(newPassword, 10);
  await db.updateUserPassword(userId, hash);
  return { success: true };
}

export async function fetchAiConfig() {
  return db.getAiConfig();
}

export async function updateAiConfig(config: import('@/lib/types').AiConfig) {
  await requireAdmin();
  await db.saveAiConfig(config);
  return { success: true };
}
