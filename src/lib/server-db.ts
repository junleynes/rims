
import Database from 'better-sqlite3';
import path from 'path';
import { BudgetEntry, User, Division, Section, Location, StatusOption, BrandingConfig, Position } from './types';

const DB_PATH = path.join(process.cwd(), 'data.db');

// Initialize database
const db = new Database(DB_PATH);

// Enable WAL mode for performance
db.pragma('journal_mode = WAL');

// Create tables if they don't exist
db.exec(`
  CREATE TABLE IF NOT EXISTS resources (
    id TEXT PRIMARY KEY,
    year INTEGER,
    division TEXT,
    section TEXT,
    location TEXT,
    classification TEXT,
    category TEXT,
    account TEXT,
    projectTitle TEXT,
    itemDescription TEXT,
    quantity INTEGER,
    unitCostBudget REAL,
    totalCostBudget REAL,
    unitCostActual REAL,
    totalCostActual REAL,
    prNumber TEXT,
    dateDelivered TEXT,
    grSisNumber TEXT,
    accountablePerson TEXT,
    status TEXT,
    statusOthers TEXT,
    remarks TEXT,
    attachmentUrl TEXT,
    createdAt TEXT
  );

  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT,
    name TEXT,
    role TEXT,
    section TEXT,
    division TEXT,
    twoFactorEnabled INTEGER,
    position TEXT,
    reportingTo TEXT,
    isStaffOnly INTEGER
  );

  CREATE TABLE IF NOT EXISTS divisions (
    id TEXT PRIMARY KEY,
    name TEXT
  );

  CREATE TABLE IF NOT EXISTS sections (
    id TEXT PRIMARY KEY,
    name TEXT,
    divisionId TEXT
  );

  CREATE TABLE IF NOT EXISTS locations (
    id TEXT PRIMARY KEY,
    name TEXT
  );

  CREATE TABLE IF NOT EXISTS status_options (
    id TEXT PRIMARY KEY,
    name TEXT
  );

  CREATE TABLE IF NOT EXISTS positions (
    id TEXT PRIMARY KEY,
    name TEXT
  );

  CREATE TABLE IF NOT EXISTS branding (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    appName TEXT,
    appAcronym TEXT,
    loginDescription TEXT,
    copyright TEXT,
    logoUrl TEXT,
    theme TEXT,
    darkMode INTEGER
  );
`);

// --- Granular Seeding Logic ---

// 1. Branding
const brandingCount = db.prepare('SELECT COUNT(*) as count FROM branding').get() as { count: number };
if (brandingCount.count === 0) {
  db.prepare(`
    INSERT INTO branding (id, appName, appAcronym, loginDescription, copyright, theme, darkMode)
    VALUES (1, 'Resource Inventory Management System', 'R.I.M.S', 
    'A specialized system for broadcast, media, and engineering departments to manage expenditures and resources with precision.',
    '© 2025 Resource Inventory Management System. All rights reserved.', 'default', 0)
  `).run();
}

// 2. Divisions
const divisionCount = db.prepare('SELECT COUNT(*) as count FROM divisions').get() as { count: number };
if (divisionCount.count === 0) {
  const initialDivisions = [
    { id: 'office-of-the-head', name: 'Office of the Head' },
    { id: 'operations-division', name: 'Operations Division' },
    { id: 'technical-and-media-server-support-division', name: 'Technical and Media Server Support Division' },
    { id: 'project-management-division', name: 'Project Management Division' }
  ];
  const insertDiv = db.prepare('INSERT INTO divisions (id, name) VALUES (?, ?)');
  initialDivisions.forEach(d => insertDiv.run(d.id, d.name));
}

// 3. Sections (The full 16-section list)
const sectionCount = db.prepare('SELECT COUNT(*) as count FROM sections').get() as { count: number };
if (sectionCount.count === 0) {
  const initialSections = [
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
  const insertSec = db.prepare('INSERT INTO sections (id, name, divisionId) VALUES (?, ?, ?)');
  initialSections.forEach(s => insertSec.run(s.id, s.name, s.divisionId));
}

// 4. Users
const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number };
if (userCount.count === 0) {
  db.prepare(`
    INSERT INTO users (id, username, name, role, position, reportingTo, twoFactorEnabled, isStaffOnly)
    VALUES ('1', 'admin', 'System Administrator', 'Admin', 'Chief Technology Officer', 'Board of Directors', 1, 0)
  `).run();

  db.prepare(`
    INSERT INTO users (id, username, name, role, section, division, position, reportingTo, twoFactorEnabled, isStaffOnly)
    VALUES ('2', 'manager_media', 'Media Manager', 'Manager', 'Media Server Support Section', 'Technical and Media Server Support Division', 'Senior Media Engineer', 'System Administrator', 0, 0)
  `).run();
}

// 5. Locations
const locationCount = db.prepare('SELECT COUNT(*) as count FROM locations').get() as { count: number };
if (locationCount.count === 0) {
  const initialLocations = [
    { id: '4th-floor', name: '4th floor' },
    { id: '5th-floor', name: '5th floor' },
    { id: '6th-floor', name: '6th floor' },
    { id: 'deployed', name: 'Deployed' }
  ];
  const insertLoc = db.prepare('INSERT INTO locations (id, name) VALUES (?, ?)');
  initialLocations.forEach(l => insertLoc.run(l.id, l.name));
}

// 6. Status Options
const statusCount = db.prepare('SELECT COUNT(*) as count FROM status_options').get() as { count: number };
if (statusCount.count === 0) {
  const initialStatus = [
    { id: 'working', name: 'working' },
    { id: 'defective', name: 'defective' },
    { id: 'turned-over', name: 'turned over to SAMD' },
    { id: 'others', name: 'others:' }
  ];
  const insertStatus = db.prepare('INSERT INTO status_options (id, name) VALUES (?, ?)');
  initialStatus.forEach(s => insertStatus.run(s.id, s.name));
}

// 7. Positions
const positionCount = db.prepare('SELECT COUNT(*) as count FROM positions').get() as { count: number };
if (positionCount.count === 0) {
  const initialPositions = [
    { id: 'vp', name: 'VP' },
    { id: 'avp', name: 'AVP' },
    { id: 'section-head', name: 'Section Head' },
    { id: 'unit-head', name: 'Unit Head' },
    { id: 'assistant-manager', name: 'Assistant Manager' },
    { id: 'senior-engineer', name: 'Senior Media Engineer' }
  ];
  const insertPos = db.prepare('INSERT INTO positions (id, name) VALUES (?, ?)');
  initialPositions.forEach(p => insertPos.run(p.id, p.name));
}

export async function getAllResources(): Promise<BudgetEntry[]> {
  const rows = db.prepare('SELECT * FROM resources ORDER BY createdAt DESC').all() as any[];
  return rows.map(row => ({
    ...row,
    unitCostActual: row.unitCostActual || 0,
    totalCostActual: row.totalCostActual || 0,
  }));
}

export async function saveResources(resources: BudgetEntry[]) {
  const deleteStmt = db.prepare('DELETE FROM resources');
  const insertStmt = db.prepare(`
    INSERT INTO resources (
      id, year, division, section, location, classification, category, account,
      projectTitle, itemDescription, quantity, unitCostBudget, totalCostBudget,
      unitCostActual, totalCostActual, prNumber, dateDelivered, grSisNumber,
      accountablePerson, status, statusOthers, remarks, attachmentUrl, createdAt
    ) VALUES (
      @id, @year, @division, @section, @location, @classification, @category, @account,
      @projectTitle, @itemDescription, @quantity, @unitCostBudget, @totalCostBudget,
      @unitCostActual, @totalCostActual, @prNumber, @dateDelivered, @grSisNumber,
      @accountablePerson, @status, @statusOthers, @remarks, @attachmentUrl, @createdAt
    )
  `);

  const transaction = db.transaction((data: BudgetEntry[]) => {
    deleteStmt.run();
    for (const item of data) {
      insertStmt.run(item);
    }
  });

  transaction(resources);
}

export async function getAllUsers(): Promise<User[]> {
  const rows = db.prepare('SELECT * FROM users').all() as any[];
  return rows.map(row => ({
    ...row,
    twoFactorEnabled: !!row.twoFactorEnabled,
    isStaffOnly: !!row.isStaffOnly,
  }));
}

export async function saveUsers(users: User[]) {
  const deleteStmt = db.prepare('DELETE FROM users');
  const insertStmt = db.prepare(`
    INSERT INTO users (id, username, name, role, section, division, twoFactorEnabled, position, reportingTo, isStaffOnly)
    VALUES (@id, @username, @name, @role, @section, @division, @twoFactorEnabled, @position, @reportingTo, @isStaffOnly)
  `);

  const transaction = db.transaction((data: User[]) => {
    deleteStmt.run();
    for (const user of data) {
      insertStmt.run({
        ...user,
        twoFactorEnabled: user.twoFactorEnabled ? 1 : 0,
        isStaffOnly: user.isStaffOnly ? 1 : 0,
      });
    }
  });

  transaction(users);
}

export async function getAllDivisions(): Promise<Division[]> {
  return db.prepare('SELECT * FROM divisions').all() as Division[];
}

export async function saveDivisions(divisions: Division[]) {
  const deleteStmt = db.prepare('DELETE FROM divisions');
  const insertStmt = db.prepare('INSERT INTO divisions (id, name) VALUES (@id, @name)');
  
  const transaction = db.transaction((data: Division[]) => {
    deleteStmt.run();
    for (const d of data) insertStmt.run(d);
  });
  transaction(divisions);
}

export async function getAllSections(): Promise<Section[]> {
  return db.prepare('SELECT * FROM sections').all() as Section[];
}

export async function saveSections(sections: Section[]) {
  const deleteStmt = db.prepare('DELETE FROM sections');
  const insertStmt = db.prepare('INSERT INTO sections (id, name, divisionId) VALUES (@id, @name, @divisionId)');
  
  const transaction = db.transaction((data: Section[]) => {
    deleteStmt.run();
    for (const s of data) insertStmt.run(s);
  });
  transaction(sections);
}

export async function getAllLocations(): Promise<Location[]> {
  return db.prepare('SELECT * FROM locations').all() as Location[];
}

export async function saveLocations(locations: Location[]) {
  const deleteStmt = db.prepare('DELETE FROM locations');
  const insertStmt = db.prepare('INSERT INTO locations (id, name) VALUES (@id, @name)');
  
  const transaction = db.transaction((data: Location[]) => {
    deleteStmt.run();
    for (const l of data) insertStmt.run(l);
  });
  transaction(locations);
}

export async function getAllStatusOptions(): Promise<StatusOption[]> {
  return db.prepare('SELECT * FROM status_options').all() as StatusOption[];
}

export async function saveStatusOptions(options: StatusOption[]) {
  const deleteStmt = db.prepare('DELETE FROM status_options');
  const insertStmt = db.prepare('INSERT INTO status_options (id, name) VALUES (@id, @name)');
  
  const transaction = db.transaction((data: StatusOption[]) => {
    deleteStmt.run();
    for (const o of data) insertStmt.run(o);
  });
  transaction(options);
}

export async function getAllPositions(): Promise<Position[]> {
  return db.prepare('SELECT * FROM positions').all() as Position[];
}

export async function savePositions(positions: Position[]) {
  const deleteStmt = db.prepare('DELETE FROM positions');
  const insertStmt = db.prepare('INSERT INTO positions (id, name) VALUES (@id, @name)');
  
  const transaction = db.transaction((data: Position[]) => {
    deleteStmt.run();
    for (const p of data) insertStmt.run(p);
  });
  transaction(positions);
}

export async function getBranding(): Promise<BrandingConfig> {
  const row = db.prepare('SELECT * FROM branding WHERE id = 1').get() as any;
  if (!row) {
    return {
      appName: 'Resource Inventory Management System',
      appAcronym: 'R.I.M.S',
      loginDescription: 'A specialized system for broadcast, media, and engineering departments to manage expenditures and resources with precision.',
      copyright: '© 2025 Resource Inventory Management System. All rights reserved.',
      theme: 'default',
      darkMode: false,
    };
  }
  return {
    ...row,
    darkMode: !!row.darkMode,
  };
}

export async function saveBranding(branding: BrandingConfig) {
  db.prepare(`
    UPDATE branding SET
      appName = @appName,
      appAcronym = @appAcronym,
      loginDescription = @loginDescription,
      copyright = @copyright,
      logoUrl = @logoUrl,
      theme = @theme,
      darkMode = @darkMode
    WHERE id = 1
  `).run({
    ...branding,
    darkMode: branding.darkMode ? 1 : 0,
  });
}
