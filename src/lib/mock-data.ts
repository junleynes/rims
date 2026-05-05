
import { BudgetEntry, User, Section, Division, Classification, Account } from './types';

export const DIVISIONS: Division[] = [
  { id: 'office-of-the-head', name: 'Office of the Head' },
  { id: 'operations-division', name: 'Operations Division' },
  { id: 'technical-and-media-server-support-division', name: 'Technical and Media Server Support Division' },
  { id: 'project-management-division', name: 'Project Management Division' }
];

export const SECTIONS: Section[] = [
  { id: 'office-of-the-head', name: 'Office of the Head', divisionId: 'office-of-the-head' },
  { id: 'post-administration-section', name: 'Post Administration Section', divisionId: 'office-of-the-head' },
  { id: 'video-edit-section', name: 'Video Edit Section', divisionId: 'operations-division' },
  { id: 'videographics-section', name: 'Videographics Section', divisionId: 'operations-division' },
  { id: 'audio-post-section', name: 'Audio Post Section', divisionId: 'operations-division' },
  { id: 'music-production-section', name: 'Music Production Section', divisionId: 'operations-division' },
  { id: 'digital-cinematography-and-standards-section', name: 'Digital Cinematography and Standards Section', divisionId: 'operations-division' },
  { id: 'content-management-section', name: 'Content Management Section', divisionId: 'operations-division' },
  { id: 'technical-support-and-toc-section', name: 'Technical Support and TOC Section', divisionId: 'technical-and-media-server-support-division' },
  { id: 'it-solutions-and-data-center-operations-section', name: 'IT Solutions and Data Center Operations Section', divisionId: 'technical-and-media-server-support-division' },
  { id: 'media-server-support-section', name: 'Media Server Support Section', divisionId: 'technical-and-media-server-support-division' },
  { id: 'facility-maintenance-section', name: 'Facility Maintenance Section', divisionId: 'technical-and-media-server-support-division' },
  { id: 'agile-content-section', name: 'Agile Content Section', divisionId: 'project-management-division' },
  { id: 'promotional-content-section', name: 'Promotional Content Section', divisionId: 'project-management-division' },
  { id: 'original-content-section', name: 'Original Content Section', divisionId: 'project-management-division' },
  { id: 'code-compliance-unit', name: 'CODE Compliance Unit', divisionId: 'project-management-division' }
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
    position: 'Chief Technology Officer',
    reportingTo: 'Board of Directors',
    twoFactorEnabled: false,
  },
  {
    id: '2',
    username: 'manager_media',
    name: 'Media Manager',
    role: 'Manager',
    section: 'Media Server Support Section',
    division: 'Technical and Media Server Support Division',
    position: 'Senior Media Engineer',
    reportingTo: 'System Administrator',
    twoFactorEnabled: false,
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
    status: 'working',
    remarks: 'Critical for upcoming sports season.',
    createdAt: '2025-01-15T10:00:00Z',
  }
];
