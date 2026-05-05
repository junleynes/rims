
'use server';

import * as db from '@/lib/server-db';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import nodemailer from 'nodemailer';
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
  username: z.string().nullable().optional().transform(v => (v === '' || v === null) ? undefined : v),
  name: z.string().min(1),
  email: z.string().email().nullable().optional().or(z.literal('')).transform(v => (v === '' || v === null) ? undefined : v),
  contactNumber: z.string().nullable().optional().transform(v => (v === '' || v === null) ? undefined : v),
  role: z.enum(['Admin', 'Manager', 'AVP', 'VP', 'Viewer']).nullable().optional(),
  section: z.string().nullable().optional().transform(v => (v === '' || v === null) ? undefined : v),
  division: z.string().nullable().optional().transform(v => (v === '' || v === null) ? undefined : v),
  twoFactorEnabled: z.boolean().nullable().optional().transform(v => v === null ? true : v),
  position: z.string().nullable().optional().transform(v => (v === '' || v === null) ? undefined : v),
  reportingTo: z.string().nullable().optional().transform(v => (v === '' || v === null) ? undefined : v),
  isStaffOnly: z.boolean().nullable().optional().transform(v => v === null ? false : v),
  profilePicture: z.string().nullable().optional().transform(v => v === '' ? undefined : v),
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
        position: userRecord.position,
        reportingTo: userRecord.reportingTo,
        profilePicture: userRecord.profilePicture,
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

export async function resetUserPassword(userId: string) {
  const tempPassword = crypto.randomBytes(4).toString('hex');
  const hash = bcrypt.hashSync(tempPassword, 10);
  
  await db.updateUserPassword(userId, hash);

  const smtp = await db.getSmtpConfig();
  const users = await db.getAllUsers();
  const targetUser = users.find(u => u.id === userId);

  if (smtp && targetUser && smtp.host) {
    try {
      const transporter = nodemailer.createTransport({
        host: smtp.host,
        port: smtp.port,
        secure: smtp.secure, 
        auth: {
          user: smtp.user,
          pass: smtp.pass,
        },
      });

      await transporter.sendMail({
        from: `"${await db.getBranding().then(b => b.appName)}" <${smtp.fromEmail}>`,
        to: targetUser.email || (targetUser.username ? `${targetUser.username}@example.com` : smtp.fromEmail), 
        subject: "Temporary System Password",
        text: `Hello ${targetUser.name},\n\nYour password has been reset. Your temporary password is: ${tempPassword}\n\nPlease change it after logging in.\n\nBest regards,\nSystem Admin`,
      });
    } catch (err) {
      console.error('Failed to send reset email:', err);
    }
  }

  return { tempPassword };
}
