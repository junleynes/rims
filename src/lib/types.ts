
export type Role = 'Admin' | 'Manager' | 'AVP' | 'VP' | 'Viewer';

export type Classification = 'Hardware' | 'Software' | 'Others';

export type BudgetCategory = 'CAPEX' | 'OPEX';

export type UpdateType = 'Info' | 'Alert' | 'Feature';

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
  locationDetails?: string;
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
  attachments?: string[];
  createdAt: string;
}

export interface User {
  id: string;
  username?: string;
  name: string;
  email?: string;
  contactNumber?: string;
  role?: Role;
  section?: string;
  division?: string;
  twoFactorEnabled?: boolean;
  twoFactorSecret?: string | null;
  position?: string;
  reportingTo?: string;
  isStaffOnly?: boolean;
  profilePicture?: string;
  needs2FASetup?: boolean;
}

export interface SystemUpdate {
  id: string;
  title: string;
  content: string;
  type: UpdateType;
  createdBy: string;
  createdAt: string;
}

export interface BrandingConfig {
  appName: string;
  appAcronym: string;
  loginDescription: string;
  copyright: string;
  logoUrl?: string;
  theme?: string;
  darkMode?: boolean;
}

export interface SystemConfig {
  maxUploadSize: number;
}

export interface SmtpConfig {
  host: string;
  port: number;
  user: string;
  pass: string;
  fromEmail: string;
  fromName: string;
  secure: boolean;
}

export interface KnowledgeBaseEntry {
  id: string;
  title: string;
  description: string;
  fileName: string;
  fileType: string;
  fileData: string;
  uploadedBy: string;
  createdAt: string;
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

export interface Position {
  id: string;
  name: string;
}

export interface LockedYear {
  year: number;
}

export type AiProvider = 'anthropic' | 'openai' | 'ollama';

export interface AiConfig {
  provider: AiProvider;
  apiKey: string;
  model: string;
  ollamaBaseUrl?: string;
  enabled: boolean;
}
