
'use server';

import { readData, writeData } from '@/lib/server-db';
import { BudgetEntry, User, Division, Section, Location, StatusOption, BrandingConfig, Position } from '@/lib/types';

export async function getResources() {
  const data = await readData();
  return data.resources;
}

export async function saveResources(resources: BudgetEntry[]) {
  const data = await readData();
  data.resources = resources;
  await writeData(data);
}

export async function getSystemData() {
  const data = await readData();
  return {
    divisions: data.divisions,
    sections: data.sections,
    locations: data.locations,
    statusOptions: data.statusOptions,
    users: data.users,
    branding: data.branding,
    positions: data.positions || []
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
  const data = await readData();
  if (update.divisions) data.divisions = update.divisions;
  if (update.sections) data.sections = update.sections;
  if (update.locations) data.locations = update.locations;
  if (update.statusOptions) data.statusOptions = update.statusOptions;
  if (update.users) data.users = update.users;
  if (update.branding) data.branding = update.branding;
  if (update.positions) data.positions = update.positions;
  await writeData(data);
}
