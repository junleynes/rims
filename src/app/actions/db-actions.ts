
'use server';

import * as db from '@/lib/server-db';
import { BudgetEntry, User, Division, Section, Location, StatusOption, BrandingConfig, Position } from '@/lib/types';

export async function getBudgets() {
  return db.getAllResources();
}

export async function saveBudgets(budgets: BudgetEntry[]) {
  await db.saveResources(budgets);
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
  if (update.divisions) await db.saveDivisions(update.divisions);
  if (update.sections) await db.saveSections(update.sections);
  if (update.locations) await db.saveLocations(update.locations);
  if (update.statusOptions) await db.saveStatusOptions(update.statusOptions);
  if (update.users) await db.saveUsers(update.users);
  if (update.branding) await db.saveBranding(update.branding);
  if (update.positions) await db.savePositions(update.positions);
  return true;
}
