'use server';

import * as db from '@/lib/server-db';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import nodemailer from 'nodemailer';
import { randomBytes } from 'crypto';
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
  email: z.preprocess(v => (v === '' || v === null) ? undefined : v, z.string().email().optional().catch(undefined)),
  contactNumber: z.preprocess(v => (v === '' || v === null) ? undefined : v, z.string().optional()),
  role: z.preprocess(v => (v === '' || v === null) ? undefined : v, z.enum(['Admin', 'Manager', 'AVP', 'VP', 'Viewer']).optional().catch(undefined)),
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
  description: z.string().optional().default(''),
  fileName: z.string().min(1),
  fileType: z.string().min(1),
  filePath: z.string().min(1),
  uploadedBy: z.string().default(''),
  createdAt: z.string(),
});

export async function getBudgets() {
  await requireSession();
  return db.getAllResources();
}

export async function saveBudgets(budgets: BudgetEntry[]) {
  const user = await requireSession();
  const validated = budgets.map(b => BudgetEntrySchema.parse(b));

  // Enforce year locking server-side. The UI already prevents edits on
  // locked years, but saveBudgets previously had no server-side check so
  // a client bypassing the UI could still write to a locked year.
  const lockedYears = await db.getAllLockedYears();
  const lockedYearSet = new Set(lockedYears.map(ly => ly.year));
  const isAdminOrVP = user.role === 'Admin' || user.role === 'VP';

  for (const entry of validated) {
    if (lockedYearSet.has(entry.year) && !isAdminOrVP) {
      throw new Error(`FY ${entry.year} is locked. Only Admin or VP can modify locked years.`);
    }
  }

  // Enforce division/section scoping for Manager and AVP — same rule the
  // UI applies, now enforced server-side so it can't be bypassed.
  if (!isAdminOrVP) {
    for (const entry of validated) {
      if (user.role === 'Manager' && entry.section !== user.section) {
        throw new Error(`Access denied: you can only modify entries within your own section.`);
      }
      if (user.role === 'AVP' && entry.division !== user.division) {
        throw new Error(`Access denied: you can only modify entries within your own division.`);
      }
    }
  }

  await db.saveResources(validated);
}

// --- Granular budget actions with audit logging ---

export async function addBudgetEntry(entry: Omit<BudgetEntry, 'id' | 'createdAt'>) {
  const user = await requireSession();
  const newEntry: BudgetEntry = {
    ...(entry as BudgetEntry),
    id: Math.random().toString(36).substr(2, 9),
    createdAt: new Date().toISOString(),
  };
  const validated = BudgetEntrySchema.parse(newEntry);
  const all = await db.getAllResources();
  await db.saveResources([validated, ...all]);
  db.logAudit({
    userId: user.id,
    username: user.username,
    action: 'budget_entry_added',
    details: `Added "${entry.projectTitle || entry.itemDescription || 'entry'}" (${entry.classification}, FY${entry.year})`,
  });
  return validated;
}

export async function updateBudgetEntry(id: string, patch: Partial<BudgetEntry>) {
  const user = await requireSession();
  const all = await db.getAllResources();
  const updated = all.map(b => (b.id === id ? { ...b, ...patch } : b));
  await db.saveResources(updated);
  db.logAudit({
    userId: user.id,
    username: user.username,
    action: 'budget_entry_updated',
    details: `Updated entry ID ${id}${patch.projectTitle ? ` — "${patch.projectTitle}"` : ''}`,
  });
}

export async function deleteBudgetEntry(id: string) {
  const user = await requireSession();
  const all = await db.getAllResources();
  const target = all.find(b => b.id === id);
  const updated = all.filter(b => b.id !== id);
  await db.saveResources(updated);
  db.logAudit({
    userId: user.id,
    username: user.username,
    action: 'budget_entry_deleted',
    details: `Deleted "${target?.projectTitle || target?.itemDescription || id}" (${target?.classification ?? ''}, FY${target?.year ?? ''})`,
  });
}

export async function importBudgetEntries(entries: Omit<BudgetEntry, 'id' | 'createdAt'>[]) {
  const user = await requireSession();
  const newEntries: BudgetEntry[] = entries.map(e => ({
    ...(e as BudgetEntry),
    id: Math.random().toString(36).substr(2, 9),
    createdAt: new Date().toISOString(),
  }));
  const validated = newEntries.map(e => BudgetEntrySchema.parse(e));
  const all = await db.getAllResources();
  await db.saveResources([...validated, ...all]);
  db.logAudit({
    userId: user.id,
    username: user.username,
    action: 'budget_imported',
    details: `Imported ${entries.length} budget entr${entries.length === 1 ? 'y' : 'ies'}`,
  });
  return validated;
}

export async function clearYearData(year: number) {
  await requireAdmin();
  await db.deleteResourcesByYear(year);
  return true;
}

export async function fetchSystemUpdates() {
  await requireSession();
  return db.getAllSystemUpdates();
}

export async function saveSystemUpdates(updates: SystemUpdate[]) {
  await requireAdmin();
  const validated = updates.map(u => SystemUpdateSchema.parse(u));
  await db.saveSystemUpdates(validated);
}

export async function fetchKnowledgeBaseEntries() {
  await requireSession();
  return db.getAllKnowledgeBaseEntries();
}

export async function createKnowledgeBaseEntry(entry: KnowledgeBaseEntry) {
  const user = await requireSession();
  let validated;
  try {
    validated = KnowledgeBaseEntrySchema.parse(entry);
  } catch (e: any) {
    throw new Error(`Validation failed: ${e?.message || 'invalid entry data'}`);
  }
  await db.saveKnowledgeBaseEntry(validated);
  try {
    db.logAudit({
      userId: user.id,
      username: user.username,
      action: 'kb_document_uploaded',
      details: `Uploaded "${entry.title}" (${entry.fileType.toUpperCase()}, ${entry.fileName})`,
    });
  } catch {
    // audit logging must never block the publish
  }
  return true;
}

export async function removeKnowledgeBaseEntry(id: string) {
  // KB entries are org-level content — restrict delete to Admin-only,
  // matching saveSystemUpdates and other org-content write actions.
  const admin = await requireAdmin();
  const existing = (await db.getAllKnowledgeBaseEntries()).find(e => e.id === id);
  await db.deleteKnowledgeBaseEntry(id);
  db.logAudit({
    userId: admin.id,
    username: admin.username,
    action: 'kb_document_deleted',
    details: `Deleted "${existing?.title ?? id}" (${existing?.fileName ?? ''})`,
  });
  return true;
}

export async function getSystemData() {
  await requireSession();
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
  const admin = await requireAdmin();
  if (update.divisions) await db.saveDivisions(update.divisions);
  if (update.sections) await db.saveSections(update.sections);
  if (update.locations) await db.saveLocations(update.locations);
  if (update.statusOptions) await db.saveStatusOptions(update.statusOptions);
  
  if (update.users) {
    const validatedUsers = update.users.map(u => UserSchema.parse(u));

    // Diff against the actual DB state (not whatever the client claims
    // happened) so create/delete/role-change events in the audit log
    // reflect what really changed.
    const previousUsers = await db.getAllUsers();
    const previousById = new Map(previousUsers.map(u => [u.id, u]));
    const nextById = new Map(validatedUsers.map(u => [u.id, u]));

    for (const u of validatedUsers) {
      if (!previousById.has(u.id)) {
        db.logAudit({ userId: admin.id, username: admin.username, action: 'user_created', details: `Created account for ${u.username ?? u.name}` });
      } else {
        const prev = previousById.get(u.id)!;
        if (prev.role !== u.role) {
          db.logAudit({ userId: admin.id, username: admin.username, action: 'user_role_changed', details: `${u.username ?? u.name}: ${prev.role ?? 'none'} → ${u.role ?? 'none'}` });
        }
      }
    }
    for (const prev of previousUsers) {
      if (!nextById.has(prev.id)) {
        db.logAudit({ userId: admin.id, username: admin.username, action: 'user_deleted', details: `Deleted account for ${prev.username ?? prev.name}` });
      }
    }

    await db.saveUsers(validatedUsers);
  }
  
  if (update.branding) await db.saveBranding(update.branding);
  if (update.positions) await db.savePositions(update.positions);

  if (update.systemConfig) {
    const previousConfig = await db.getSystemConfig();
    if (!!previousConfig.maintenanceMode !== !!update.systemConfig.maintenanceMode) {
      db.logAudit({
        userId: admin.id,
        username: admin.username,
        action: update.systemConfig.maintenanceMode ? 'maintenance_enabled' : 'maintenance_disabled',
      });
    }
    await db.saveSystemConfig(update.systemConfig);
  }

  if (update.lockedYears) await db.saveLockedYears(update.lockedYears);
  
  return true;
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
  const branding = await db.getBranding();
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
        name: config.fromName || `${branding.appAcronym} Notifications`,
        address: config.fromEmail,
      },
      to: targetEmail,
      subject: `${branding.appAcronym} SMTP Connection Test`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
          <h2 style="color: #2E86AB;">SMTP Connection Test</h2>
          <p>Hello,</p>
          <p>This is a test email confirming that your SMTP configuration for the <strong>${branding.appName} (${branding.appAcronym})</strong> is working correctly.</p>
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
  const admin = await requireAdmin();
  const smtp = await db.getSmtpConfig();
  if (!smtp || !smtp.host) {
    return { success: false, message: "SMTP is not configured. Please go to System Settings." };
  }

  const user = await db.getUserById(userId);
  if (!user || !user.email) {
    return { success: false, message: "User email not found or user does not exist." };
  }

  const branding = await db.getBranding();

  // Math.random() is not a CSPRNG and shouldn't be used for anything
  // resembling a credential, even a temporary one — use randomBytes instead.
  const tempPassword = randomBytes(9).toString('base64url');
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
        name: smtp.fromName || `${branding.appAcronym} Notifications`,
        address: smtp.fromEmail,
      },
      to: user.email,
      subject: `${branding.appAcronym} Account Credentials - Password Reset`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
          <h2 style="color: #2E86AB;">Account Access Information</h2>
          <p>Hello <strong>${user.name}</strong>,</p>
          <p>Your password for the <strong>${branding.appName} (${branding.appAcronym})</strong> has been reset by an administrator.</p>
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
    db.logAudit({
      userId: admin.id,
      username: admin.username,
      action: 'password_reset_by_admin',
      details: `Reset password and emailed credentials to ${user.username}`,
    });
    return { success: true };
  } catch (error: any) {
    console.error('Email Dispatch Error:', error);
    db.logAudit({
      userId: admin.id,
      username: admin.username,
      action: 'password_reset_by_admin',
      details: `Failed to email credentials to ${user.username}`,
      success: false,
    });
    return { success: false, message: 'Failed to dispatch email. Check your SMTP configuration in System Settings.' };
  }
}

export async function resetUserPassword(userId: string, newPassword: string) {
  const admin = await requireAdmin();
  const hash = bcrypt.hashSync(newPassword, 10);
  await db.updateUserPassword(userId, hash);
  const target = await db.getUserById(userId);
  db.logAudit({
    userId: admin.id,
    username: admin.username,
    action: 'password_reset_by_admin',
    details: `Reset password for ${target?.username ?? userId}`,
  });
  return { success: true };
}

export async function fetchAuditLog(limit?: number) {
  await requireAdmin();
  return db.getAuditLog(limit);
}

export async function fetchAiConfig() {
  return db.getAiConfig();
}

export async function updateAiConfig(config: import('@/lib/types').AiConfig) {
  await requireAdmin();
  await db.saveAiConfig(config);
  return { success: true };
}

export async function getMaintenanceMode(): Promise<boolean> {
  const config = await db.getSystemConfig();
  return !!config.maintenanceMode;
}

export async function setMaintenanceMode(enabled: boolean) {
  await requireAdmin();
  const config = await db.getSystemConfig();
  await db.saveSystemConfig({ ...config, maintenanceMode: enabled });
  return { success: true };
}
