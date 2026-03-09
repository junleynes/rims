
export type Role = 'Admin' | 'Manager';

export type Section = 
  | 'Media Server Support'
  | 'Post Production'
  | 'Engineering'
  | 'Broadcast IT';

export type Category = 'CAPEX' | 'OPEX';

export type OPEXSubcategory = 
  | 'Manpower'
  | 'Promotions'
  | 'Overtime'
  | 'Communications'
  | 'Repair and Maintenance'
  | 'Miscellaneous'
  | 'Seminars and Training';

export type CAPEXSubcategory = 
  | 'Equipment'
  | 'Storage systems'
  | 'Servers'
  | 'Hardware upgrades';

export type Subcategory = OPEXSubcategory | CAPEXSubcategory;

export interface BudgetEntry {
  id: string;
  year: number;
  section: Section;
  category: Category;
  subcategory: Subcategory;
  actionPlan: string;
  description: string;
  quantity: number;
  unitCost: number;
  totalCost: number;
  rolloutSchedule: string;
  remarks: string;
  createdAt: string;
}

export interface User {
  id: string;
  username: string;
  name: string;
  role: Role;
  section?: Section; // Only for Managers
}
