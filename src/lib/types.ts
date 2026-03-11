
export type Role = 'Admin' | 'Manager';

export type Classification = 'Hardware' | 'Software' | 'Others';

export type BudgetCategory = 'CAPEX' | 'OPEX';

export type Account = 
  | 'Capex'
  | 'Seminars and Trainings - online or face to face'
  | 'Seminars and Trainings - Subscriptions/Annual Renewal'
  | 'Repairs and Maintenance - one time purchase'
  | 'Repairs and Maintenance - Subscriptions/Annual Renewal'
  | 'Miscellaneous - Perpetual'
  | 'Miscellaneous - Subscriptions/Annual Renewal'
  | 'Office Supplies';

export interface BudgetEntry {
  id: string;
  year: number;
  division: string;
  section: string;
  location: string;
  classification: Classification;
  category: BudgetCategory;
  account: Account;
  projectTitle: string;
  itemDescription: string;
  quantity: number;
  unitCostBudget: number;
  totalCostBudget: number;
  unitCostActual?: number;
  totalCostActual?: number;
  prNumber?: string;
  dateDelivered?: string;
  grSisNumber?: string;
  accountablePerson?: string;
  status: string;
  statusOthers?: string;
  remarks: string;
  createdAt: string;
}

export interface User {
  id: string;
  username: string;
  name: string;
  role: Role;
  section?: string;
  division?: string;
}

export interface BrandingConfig {
  appName: string;
  appAcronym: string;
}

export interface Location {
  id: string;
  name: string;
}

export interface Division {
  id: string;
  name: string;
}

export interface Section {
  id: string;
  name: string;
  divisionId: string;
}

export interface StatusOption {
  id: string;
  name: string;
}
