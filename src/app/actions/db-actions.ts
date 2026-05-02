
'use server';

import * as db from '@/lib/server-db';
import { z } from 'zod';
import { BudgetEntry, User, Division, Section, Location, StatusOption, BrandingConfig, Position } from '@/lib/types';

// Strict validation schemas
const BudgetEntrySchema = z.object({
  id: z.string(),
  year: z.number().int(),
  division: z.string(),
  section: z.string(),
  location: z.string(),
  classification: z.enum(['Hardware', 'Software', 'Others']),
  category: z.enum(['CAPEX', 'OPEX']),
  account: z.string(),
  projectTitle: z.string().min(1),
  itemDescription: z.string(),
  quantity: z.number().int().min(1),
  unitCostBudget: z.number().min(0),
  totalCostBudget: z.number(),
  unitCostActual: z.number().optional(),
  totalCostActual: z.number().optional(),
  prNumber: z.string().optional(),
  dateDelivered: z.string().optional(),
  grSisNumber: z.string().optional(),
  accountablePerson: z.string().optional(),
  status: z.string(),
  statusOthers: z.string().optional(),
  remarks: z.string(),
  attachmentUrl: z.string().optional().refine((val) => {
    if (!val) return true;
    // Basic sanitization: check for safe protocols
    return /^(data:image|http:\/\/|https:\/\/)/i.test(val);
  }, "Invalid attachment URL protocol"),
  createdAt: z.string(),
});

const UserSchema = z.object({
  id: z.string(),
  username: z.string().optional(),
  name: z.string().min(1),
  role: z.enum(['Admin', 'Manager', 'AVP', 'VP']).optional(),
  section: z.string().optional(),
  division: z.string().optional(),
  twoFactorEnabled: z.boolean().optional(),
  position: z.string().optional(),
  reportingTo: z.string().optional(),
  isStaffOnly: z.boolean().optional(),
});

export async function getBudgets() {
  return db.getAllResources();
}

export async function saveBudgets(budgets: BudgetEntry[]) {
  // Validate every entry
  const validated = budgets.map(b => BudgetEntrySchema.parse(b));
  await db.saveResources(validated);
}

export async function getSystemData() {
  const [divisions, sections, locations, statusOptions, users, branding, positions] = await Promise.all([
    db.getAllDivisions(),
    db.getAllSections(),
    db.getAllLocations(),
    db.getAllStatusOptions(),
    db.getAllUsers(),
    db.getBranding(),
    db.getAllPositions()
  ]);

  return {
    divisions,
    sections,
    locations,
    statusOptions,
    users,
    branding,
    positions
  };
}

export async function saveSystemData(update: {
  divisions?: Division[],
  sections?: Section[],
  locations?: Location[],
  statusOptions?: StatusOption[],
  users?: User[],
  branding?: BrandingConfig,
  positions?: Position[]
}) {
  // Granular validation and synchronization
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
  
  return true;
}
