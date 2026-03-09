
export type Role = 'Admin' | 'Manager';

export type Division = 
  | 'Office of the Head'
  | 'Operations Division'
  | 'Technical and Media Server Support Division'
  | 'Project Management Division';

export type Section = 
  | 'Office of the Head'
  | 'Post Administration Section'
  | 'Video Edit Section'
  | 'Videographics Section'
  | 'Audio Post Section'
  | 'Music Production Section'
  | 'Digital Cinematography and Standards Section'
  | 'Content Management Section'
  | 'Technical Support and TOC Section'
  | 'IT Solutions and Data Center Operations Section'
  | 'Media Server Support Section'
  | 'Facility Maintenance Section'
  | 'Agile Content Section'
  | 'Promotional Content Section'
  | 'Original Content Section'
  | 'CODE Compliance Unit';

export type Classification = 'Hardware' | 'Software' | 'Others';

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
  division: Division;
  section: Section;
  classification: Classification;
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
  remarks: string;
  createdAt: string;
}

export interface User {
  id: string;
  username: string;
  name: string;
  role: Role;
  section?: Section;
  division?: Division;
}
