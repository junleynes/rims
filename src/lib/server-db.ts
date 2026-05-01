
import fs from 'fs';
import path from 'path';
import { BudgetEntry, User, Division, Section, Location, StatusOption, BrandingConfig, Position } from './types';

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
    const initialData: AppData = {
      resources: [],
      users: [
        {
          id: '1',
          username: 'admin',
          name: 'System Administrator',
          role: 'Admin',
          position: 'Chief Technology Officer',
          reportingTo: 'Board of Directors',
          twoFactorEnabled: true,
        }
      ],
      divisions: [
        { id: 'office-of-the-head', name: 'Office of the Head' },
        { id: 'operations-division', name: 'Operations Division' },
        { id: 'technical-and-media-server-support-division', name: 'Technical and Media Server Support Division' },
        { id: 'project-management-division', name: 'Project Management Division' }
      ],
      sections: [],
      locations: [
        { id: '4th-floor', name: '4th floor' },
        { id: '5th-floor', name: '5th floor' },
        { id: '6th-floor', name: '6th floor' },
        { id: 'deployed', name: 'Deployed' }
      ],
      statusOptions: INITIAL_STATUS_OPTIONS,
      positions: INITIAL_POSITIONS,
      branding: {
        appName: 'Resource Inventory Management System',
        appAcronym: 'R.I.M.S',
        theme: 'default',
        darkMode: false
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
