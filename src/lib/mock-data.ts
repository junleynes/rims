
import { BudgetEntry, User, Section } from './types';

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
    section: 'Media Server Support',
  },
  {
    id: '3',
    username: 'manager_post',
    name: 'Post Production Lead',
    role: 'Manager',
    section: 'Post Production',
  },
];

export const MOCK_BUDGETS: BudgetEntry[] = [
  {
    id: 'b1',
    year: 2026,
    section: 'Media Server Support',
    category: 'CAPEX',
    subcategory: 'Storage systems',
    actionPlan: 'SAN Expansion for 4K workflows',
    description: 'Upgrade existing storage cluster with 1PB additional capacity.',
    quantity: 1,
    unitCost: 3000000,
    totalCost: 3000000,
    rolloutSchedule: 'Q1 2026',
    remarks: 'Critical for upcoming sports season.',
    createdAt: '2025-01-15T10:00:00Z',
  },
  {
    id: 'b2',
    year: 2026,
    section: 'Media Server Support',
    category: 'OPEX',
    subcategory: 'Manpower',
    actionPlan: 'Additional support staff',
    description: 'Hire 2 contractors for 24/7 coverage.',
    quantity: 2,
    unitCost: 1000000,
    totalCost: 2000000,
    rolloutSchedule: 'Full Year 2026',
    remarks: 'Mandatory due to increased output.',
    createdAt: '2025-01-16T11:00:00Z',
  },
  {
    id: 'b3',
    year: 2027,
    section: 'Engineering',
    category: 'CAPEX',
    subcategory: 'Servers',
    actionPlan: 'Master Control Hardware Refresh',
    description: 'Replace aging playout servers.',
    quantity: 4,
    unitCost: 1000000,
    totalCost: 4000000,
    rolloutSchedule: 'Q2 2027',
    remarks: 'Old hardware reaching EOL.',
    createdAt: '2025-02-01T09:30:00Z',
  },
  {
    id: 'b4',
    year: 2026,
    section: 'Post Production',
    category: 'OPEX',
    subcategory: 'Overtime',
    actionPlan: 'Seasonal peaks coverage',
    description: 'Estimated OT for editing team during peak production months.',
    quantity: 1,
    unitCost: 500000,
    totalCost: 500000,
    rolloutSchedule: 'Jun-Aug 2026',
    remarks: '',
    createdAt: '2025-02-05T14:20:00Z',
  },
];

export const SECTIONS: Section[] = [
  'Media Server Support',
  'Post Production',
  'Engineering',
  'Broadcast IT'
];

export const CATEGORIES = {
  CAPEX: ['Equipment', 'Storage systems', 'Servers', 'Hardware upgrades'],
  OPEX: ['Manpower', 'Promotions', 'Overtime', 'Communications', 'Repair and Maintenance', 'Miscellaneous', 'Seminars and Training']
};
