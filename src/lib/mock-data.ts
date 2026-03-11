
import { BudgetEntry, User, Section, Division, Classification, Account } from './types';

export const DIVISIONS: Division[] = [
  'Office of the Head',
  'Operations Division',
  'Technical and Media Server Support Division',
  'Project Management Division'
];

export const SECTIONS: Section[] = [
  'Office of the Head',
  'Post Administration Section',
  'Video Edit Section',
  'Videographics Section',
  'Audio Post Section',
  'Music Production Section',
  'Digital Cinematography and Standards Section',
  'Content Management Section',
  'Technical Support and TOC Section',
  'IT Solutions and Data Center Operations Section',
  'Media Server Support Section',
  'Facility Maintenance Section',
  'Agile Content Section',
  'Promotional Content Section',
  'Original Content Section',
  'CODE Compliance Unit'
];

export const LOCATIONS = [
  '4th floor',
  '5th floor',
  '6th floor',
  'Deployed'
];

export const DIVISION_SECTIONS_MAP: Record<string, string[]> = {
  'Office of the Head': ['Office of the Head', 'Post Administration Section'],
  'Operations Division': [
    'Video Edit Section',
    'Videographics Section',
    'Audio Post Section',
    'Music Production Section',
    'Digital Cinematography and Standards Section',
    'Content Management Section'
  ],
  'Technical and Media Server Support Division': [
    'Technical Support and TOC Section',
    'IT Solutions and Data Center Operations Section',
    'Media Server Support Section',
    'Facility Maintenance Section'
  ],
  'Project Management Division': [
    'Agile Content Section',
    'Promotional Content Section',
    'Original Content Section',
    'CODE Compliance Unit'
  ]
};

export const CLASSIFICATIONS: Classification[] = ['Hardware', 'Software', 'Others'];

export const OPEX_ACCOUNTS: Account[] = [
  'Seminars and Trainings - online or face to face',
  'Seminars and Trainings - Subscriptions/Annual Renewal',
  'Repairs and Maintenance - one time purchase',
  'Repairs and Maintenance - Subscriptions/Annual Renewal',
  'Miscellaneous - Perpetual',
  'Miscellaneous - Subscriptions/Annual Renewal',
  'Office Supplies'
];

export const ACCOUNTS: Account[] = [
  'Capex',
  ...OPEX_ACCOUNTS
];

export const MOCK_USERS: User[] = [
  {
    id: '1',
    username: 'admin',
    name: 'System Administrator',
    role: 'Admin',
  },
  {
    id: '2',
    username: 'manager_media',
    name: 'Media Manager',
    role: 'Manager',
    section: 'Media Server Support Section',
    division: 'Technical and Media Server Support Division',
  },
];

export const MOCK_BUDGETS: BudgetEntry[] = [
  {
    id: 'b1',
    year: 2026,
    division: 'Technical and Media Server Support Division',
    section: 'Media Server Support Section',
    location: '5th floor',
    classification: 'Hardware',
    category: 'CAPEX',
    account: 'Capex',
    projectTitle: 'SAN Expansion for 4K workflows',
    itemDescription: 'Upgrade existing storage cluster with 1PB additional capacity.',
    quantity: 1,
    unitCostBudget: 3000000,
    totalCostBudget: 3000000,
    remarks: 'Critical for upcoming sports season.',
    createdAt: '2025-01-15T10:00:00Z',
  }
];
