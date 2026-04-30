
import fs from 'fs';
import path from 'path';
import { BudgetEntry, User, Division, Section, Location, StatusOption, BrandingConfig, Position } from './types';
import { MOCK_BUDGETS, MOCK_USERS, DIVISIONS, SECTIONS, DIVISION_SECTIONS_MAP, LOCATIONS } from './mock-data';

const DB_PATH = path.join(process.cwd(), 'data-storage.json');

const INITIAL_STATUS_OPTIONS = [
  { id: 'working', name: 'working' },
  { id: 'defective', name: 'defective' },
  { id: 'turned-over', name: 'turned over to SAMD' },
  { id: 'others', name: 'others:' }
];

const INITIAL_POSITIONS = [
  { id: 'vp', name: 'VP' },
  { id: 'avp', name: 'AVP' },
  { id: 'section-head', name: 'Section Head' },
  { id: 'unit-head', name: 'Unit Head' },
  { id: 'assistant-manager', name: 'Assistant Manager' }
];

interface AppData {
  resources: BudgetEntry[];
  users: User[];
  divisions: Division[];
  sections: Section[];
  locations: Location[];
  statusOptions: StatusOption[];
  branding: BrandingConfig;
  positions: Position[];
}

function ensureDataFile() {
  if (!fs.existsSync(DB_PATH)) {
    const initialDivs = DIVISIONS.map(d => ({ id: d.id, name: d.name }));
    const initialSecs = SECTIONS.map(s => ({ id: s.id, name: s.name, divisionId: s.divisionId }));
    const initialLocs = LOCATIONS.map(l => ({ id: l.toLowerCase().replace(/\s+/g, '-'), name: l }));

    const initialData: AppData = {
      resources: MOCK_BUDGETS,
      users: MOCK_USERS,
      divisions: initialDivs,
      sections: initialSecs,
      locations: initialLocs,
      statusOptions: INITIAL_STATUS_OPTIONS,
      positions: INITIAL_POSITIONS,
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
  const data = JSON.parse(raw);
  // Ensure positions exist if reading an older file
  if (!data.positions) {
    data.positions = INITIAL_POSITIONS;
  }
  return data;
}

export async function writeData(data: AppData) {
  ensureDataFile();
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
}
