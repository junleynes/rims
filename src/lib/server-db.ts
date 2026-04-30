
import fs from 'fs';
import path from 'path';
import { BudgetEntry, User, Division, Section, Location, StatusOption, BrandingConfig } from './types';
import { MOCK_BUDGETS, MOCK_USERS, DIVISIONS, SECTIONS, DIVISION_SECTIONS_MAP, LOCATIONS } from './mock-data';

const DB_PATH = path.join(process.cwd(), 'data-storage.json');

const INITIAL_STATUS_OPTIONS = [
  { id: 'working', name: 'working' },
  { id: 'defective', name: 'defective' },
  { id: 'turned-over', name: 'turned over to SAMD' },
  { id: 'others', name: 'others:' }
];

interface AppData {
  resources: BudgetEntry[];
  users: User[];
  divisions: Division[];
  sections: Section[];
  locations: Location[];
  statusOptions: StatusOption[];
  branding: BrandingConfig;
}

function ensureDataFile() {
  if (!fs.existsSync(DB_PATH)) {
    const initialDivs = DIVISIONS.map(d => ({ id: d.toLowerCase().replace(/\s+/g, '-'), name: d }));
    const initialSecs: Section[] = [];
    Object.entries(DIVISION_SECTIONS_MAP).forEach(([divName, secNames]) => {
      const divId = divName.toLowerCase().replace(/\s+/g, '-');
      secNames.forEach(s => {
        initialSecs.push({ id: s.toLowerCase().replace(/\s+/g, '-'), name: s, divisionId: divId });
      });
    });
    const initialLocs = LOCATIONS.map(l => ({ id: l.toLowerCase().replace(/\s+/g, '-'), name: l }));

    const initialData: AppData = {
      resources: MOCK_BUDGETS,
      users: MOCK_USERS,
      divisions: initialDivs,
      sections: initialSecs,
      locations: initialLocs,
      statusOptions: INITIAL_STATUS_OPTIONS,
      branding: {
        appName: 'Resource Inventory Management System',
        appAcronym: 'R.I.M.S',
      }
    };
    fs.writeFileSync(DB_PATH, JSON.stringify(initialData, null, 2));
  }
}

export async function readData(): Promise<AppData> {
  ensureDataFile();
  const raw = fs.readFileSync(DB_PATH, 'utf-8');
  return JSON.parse(raw);
}

export async function writeData(data: AppData) {
  ensureDataFile();
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
}
