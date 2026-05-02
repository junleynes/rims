
import Database from 'better-sqlite3';
import path from 'path';
import bcrypt from 'bcryptjs';
import { BudgetEntry, User, Division, Section, Location, StatusOption, BrandingConfig, Position, SmtpConfig, SystemUpdate } from './types';

const DB_PATH = path.join(process.cwd(), 'data.db');

// Initialize database
const db = new Database(DB_PATH);

// Enable WAL mode for performance and concurrent access
db.pragma('journal_mode = WAL');
db.pragma('synchronous = NORMAL');
db.pragma('foreign_keys = ON');

// Create tables if they don't exist
db.exec(`
  CREATE TABLE IF NOT EXISTS resources (
    id TEXT PRIMARY KEY,
    year INTEGER NOT NULL,
    division TEXT NOT NULL,
    section TEXT NOT NULL,
    location TEXT,
    classification TEXT,
    category TEXT NOT NULL,
    account TEXT,
    projectTitle TEXT NOT NULL,
    itemDescription TEXT,
    quantity INTEGER DEFAULT 1,
    unitCostBudget REAL DEFAULT 0,
    totalCostBudget REAL DEFAULT 0,
    unitCostActual REAL DEFAULT 0,
    totalCostActual REAL DEFAULT 0,
    prNumber TEXT,
    dateDelivered TEXT,
    grSisNumber TEXT,
    accountablePerson TEXT,
    status TEXT,
    statusOthers TEXT,
    remarks TEXT,
    attachmentUrl TEXT,
    createdAt TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE,
    password_hash TEXT,
    name TEXT NOT NULL,
    email TEXT,
    contactNumber TEXT,
    role TEXT,
    section TEXT,
    division TEXT,
    twoFactorEnabled INTEGER DEFAULT 1,
    position TEXT,
    reportingTo TEXT,
    isStaffOnly INTEGER DEFAULT 0,
    profilePicture TEXT
  );

  CREATE TABLE IF NOT EXISTS system_updates (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    type TEXT NOT NULL,
    createdBy TEXT NOT NULL,
    createdAt TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS divisions (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS sections (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    divisionId TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS locations (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS status_options (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS positions (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS branding (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    appName TEXT,
    appAcronym TEXT,
    loginDescription TEXT,
    copyright TEXT,
    logoUrl TEXT,
    theme TEXT,
    darkMode INTEGER DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS smtp_settings (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    host TEXT,
    port INTEGER,
    user TEXT,
    pass TEXT,
    fromEmail TEXT,
    secure INTEGER DEFAULT 0
  );
`);

// Handle migration for existing databases without profilePicture column
try {
  db.prepare('ALTER TABLE users ADD COLUMN profilePicture TEXT').run();
} catch (e) {
  // Column already exists or other error
}

// --- Granular Seeding Logic ---
const seedIfEmpty = (tableName: string, query: string, params: any[] = []) => {
  const count = (db.prepare(`SELECT COUNT(*) as count FROM ${tableName}`).get() as any).count;
  if (count === 0) {
    db.prepare(query).run(...params);
  }
};

// 1. Branding
seedIfEmpty('branding', `
  INSERT INTO branding (id, appName, appAcronym, loginDescription, copyright, theme, darkMode)
  VALUES (1, 'Resource Inventory Management System', 'R.I.M.S', 
  'A specialized system for broadcast, media, and engineering departments to manage expenditures and resources with precision.',
  '© 2025 Resource Inventory Management System. All rights reserved.', 'sunset', 0)
`);

// 2. Divisions
seedIfEmpty('divisions', `
  INSERT INTO divisions (id, name) VALUES 
  ('office-of-the-head', 'Office of the Head'),
  ('operations-division', 'Operations Division'),
  ('technical-and-media-server-support-division', 'Technical and Media Server Support Division'),
  ('project-management-division', 'Project Management Division')
`);

// 3. Sections
seedIfEmpty('sections', `
  INSERT INTO sections (id, name, divisionId) VALUES 
  ('office-of-the-head', 'Office of the Head', 'office-of-the-head'),
  ('post-administration-section', 'Post Administration Section', 'office-of-the-head'),
  ('video-edit-section', 'Video Edit Section', 'operations-division'),
  ('videographics-section', 'Videographics Section', 'operations-division'),
  ('audio-post-section', 'Audio Post Section', 'operations-division'),
  ('music-production-section', 'Music Production Section', 'operations-division'),
  ('digital-cinematography-and-standards-section', 'Digital Cinematography and Standards Section', 'operations-division'),
  ('content-management-section', 'Content Management Section', 'operations-division'),
  ('technical-support-and-toc-section', 'Technical Support and TOC Section', 'technical-and-media-server-support-division'),
  ('it-solutions-and-data-center-operations-section', 'IT Solutions and Data Center Operations Section', 'technical-and-media-server-support-division'),
  ('media-server-support-section', 'Media Server Support Section', 'technical-and-media-server-support-division'),
  ('facility-maintenance-section', 'Facility Maintenance Section', 'technical-and-media-server-support-division'),
  ('agile-content-section', 'Agile Content Section', 'project-management-division'),
  ('promotional-content-section', 'Promotional Content Section', 'project-management-division'),
  ('original-content-section', 'Original Content Section', 'project-management-division'),
  ('code-compliance-unit', 'CODE Compliance Unit', 'project-management-division')
`);

// 4. Users (Seeding with hashed password)
const adminPasswordHash = bcrypt.hashSync('password', 10);
seedIfEmpty('users', `
  INSERT INTO users (id, username, password_hash, name, email, contactNumber, role, position, reportingTo, twoFactorEnabled, isStaffOnly)
  VALUES ('1', 'admin', ?, 'System Administrator', 'admin@example.com', 'N/A', 'Admin', 'Chief Technology Officer', 'Board of Directors', 1, 0)
`, [adminPasswordHash]);

// 5. Locations
seedIfEmpty('locations', `
  INSERT INTO locations (id, name) VALUES 
  ('4th-floor', '4th floor'),
  ('5th-floor', '5th floor'),
  ('6th-floor', '6th floor'),
  ('deployed', 'Deployed')
`);

// 6. Status Options
seedIfEmpty('status_options', `
  INSERT INTO status_options (id, name) VALUES 
  ('working', 'working'),
  ('defective', 'defective'),
  ('turned-over', 'turned over to SAMD'),
  ('others', 'others:')
`);

// 7. Positions
seedIfEmpty('positions', `
  INSERT INTO positions (id, name) VALUES 
  ('vp', 'VP'),
  ('avp', 'AVP'),
  ('section-head', 'Section Head'),
  ('unit-head', 'Unit Head'),
  ('assistant-manager', 'Assistant Manager'),
  ('senior-engineer', 'Senior Media Engineer')
`);

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

export async function getUserByUsername(username: string): Promise<any | null> {
  return db.prepare('SELECT * FROM users WHERE username = ?').get(username) || null;
}

export async function saveUsers(users: User[]) {
  const deleteStmt = db.prepare('DELETE FROM users');
  const insertStmt = db.prepare(`
    INSERT INTO users (id, username, password_hash, name, email, contactNumber, role, section, division, twoFactorEnabled, position, reportingTo, isStaffOnly, profilePicture)
    VALUES (@id, @username, @password_hash, @name, @email, @contactNumber, @role, @section, @division, @twoFactorEnabled, @position, @reportingTo, @isStaffOnly, @profilePicture)
  `);

  const existingHashes = db.prepare('SELECT id, password_hash FROM users').all() as any[];
  const hashMap = new Map(existingHashes.map(h => [h.id, h.password_hash]));

  const transactionSafe = db.transaction((data: User[]) => {
    deleteStmt.run();
    for (const user of data) {
      insertStmt.run({
        ...user,
        password_hash: hashMap.get(user.id) || bcrypt.hashSync('password', 10),
        twoFactorEnabled: user.twoFactorEnabled ? 1 : 0,
        isStaffOnly: user.isStaffOnly ? 1 : 0,
        profilePicture: user.profilePicture || null
      });
    }
  });

  transactionSafe(users);
}

export async function updateUserPassword(userId: string, hash: string) {
  db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(hash, userId);
}

// System Updates
export async function getAllSystemUpdates(): Promise<SystemUpdate[]> {
  return db.prepare('SELECT * FROM system_updates ORDER BY createdAt DESC').all() as SystemUpdate[];
}

export async function saveSystemUpdates(updates: SystemUpdate[]) {
  const deleteStmt = db.prepare('DELETE FROM system_updates');
  const insertStmt = db.prepare(`
    INSERT INTO system_updates (id, title, content, type, createdBy, createdAt)
    VALUES (@id, @title, @content, @type, @createdBy, @createdAt)
  `);

  const transaction = db.transaction((data: SystemUpdate[]) => {
    deleteStmt.run();
    for (const update of data) {
      insertStmt.run(update);
    }
  });

  transaction(updates);
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
      theme: 'sunset',
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

export async function getSmtpConfig(): Promise<SmtpConfig | null> {
  const row = db.prepare('SELECT * FROM smtp_settings WHERE id = 1').get() as any;
  if (!row) return null;
  return {
    ...row,
    secure: !!row.secure,
  };
}

export async function saveSmtpConfig(config: SmtpConfig) {
  const existing = await getSmtpConfig();
  const params = {
    ...config,
    secure: config.secure ? 1 : 0,
  };
  if (existing) {
    db.prepare(`
      UPDATE smtp_settings SET
        host = @host,
        port = @port,
        user = @user,
        pass = @pass,
        fromEmail = @fromEmail,
        secure = @secure
      WHERE id = 1
    `).run(params);
  } else {
    db.prepare(`
      INSERT INTO smtp_settings (id, host, port, user, pass, fromEmail, secure)
      VALUES (1, @host, @port, @user, @pass, @fromEmail, @secure)
    `).run(params);
  }
}
