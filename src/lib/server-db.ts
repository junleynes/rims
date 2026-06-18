
import Database from 'better-sqlite3';
import path from 'path';
import { mkdirSync, existsSync } from 'fs';
import bcrypt from 'bcryptjs';
import { BudgetEntry, User, Division, Section, Location, StatusOption, BrandingConfig, SystemConfig, Position, SmtpConfig, SystemUpdate, KnowledgeBaseEntry, LockedYear } from './types';

// Ensure upload directories exist on startup
const UPLOAD_DIR = path.join(process.cwd(), 'uploads');
for (const folder of ['knowledge-base', 'budget-attachments', 'avatars']) {
  const dir = path.join(UPLOAD_DIR, folder);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
}

const DB_PATH = path.join(process.cwd(), 'data.db');
const db = new Database(DB_PATH);

// Enable WAL mode for performance and concurrent access
db.pragma('journal_mode = WAL');
db.pragma('synchronous = NORMAL');
db.pragma('foreign_keys = ON');

// Global pre-calculated hash to optimize user persistence
const DEFAULT_PASSWORD_HASH = bcrypt.hashSync('password', 10);

// Create tables if they don't exist
db.exec(`
  CREATE TABLE IF NOT EXISTS resources (
    id TEXT PRIMARY KEY,
    year INTEGER NOT NULL,
    division TEXT NOT NULL,
    section TEXT NOT NULL,
    location TEXT,
    locationDetails TEXT,
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
    attachments TEXT,
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
    twoFactorEnabled INTEGER DEFAULT 0,
    twoFactorSecret TEXT,
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

  CREATE TABLE IF NOT EXISTS knowledge_base (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    fileName TEXT NOT NULL,
    fileType TEXT NOT NULL,
    filePath TEXT NOT NULL DEFAULT '',
    uploadedBy TEXT NOT NULL,
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
    theme TEXT
  );

  CREATE TABLE IF NOT EXISTS system_config (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    maxUploadSize INTEGER DEFAULT 20
  );

  CREATE TABLE IF NOT EXISTS smtp_settings (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    host TEXT,
    port INTEGER,
    user TEXT,
    pass TEXT,
    fromEmail TEXT,
    fromName TEXT,
    secure INTEGER DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS locked_years (
    year INTEGER PRIMARY KEY
  );

  CREATE TABLE IF NOT EXISTS ai_config (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    provider TEXT DEFAULT 'anthropic',
    apiKey TEXT DEFAULT '',
    model TEXT DEFAULT 'claude-sonnet-4-20250514',
    ollamaBaseUrl TEXT DEFAULT 'http://localhost:11434',
    enabled INTEGER DEFAULT 0
  );
`);

// --- Advanced Migrations (Safe Column Addition) ---
function addColumnIfNotExists(table: string, column: string, type: string) {
  try {
    const info = db.prepare(`PRAGMA table_info(${table})`).all() as any[];
    const exists = info.some(col => col.name === column);
    if (!exists) {
      db.prepare(`ALTER TABLE ${table} ADD COLUMN ${column} ${type}`).run();
    }
  } catch (e) {
    console.warn(`Migration failed for ${table}.${column}:`, e);
  }
}

addColumnIfNotExists('users', 'password_hash', 'TEXT');
addColumnIfNotExists('users', 'profilePicture', 'TEXT');
addColumnIfNotExists('users', 'isStaffOnly', 'INTEGER DEFAULT 0');
addColumnIfNotExists('users', 'contactNumber', 'TEXT');
addColumnIfNotExists('users', 'email', 'TEXT');
addColumnIfNotExists('users', 'position', 'TEXT');
addColumnIfNotExists('users', 'reportingTo', 'TEXT');
addColumnIfNotExists('users', 'twoFactorSecret', 'TEXT');
addColumnIfNotExists('smtp_settings', 'secure', 'INTEGER DEFAULT 0');
addColumnIfNotExists('smtp_settings', 'fromName', 'TEXT');
addColumnIfNotExists('branding', 'theme', 'TEXT');
addColumnIfNotExists('resources', 'locationDetails', 'TEXT');
addColumnIfNotExists('resources', 'attachments', 'TEXT');
addColumnIfNotExists('ai_config', 'ollamaBaseUrl', "TEXT DEFAULT 'http://localhost:11434'");
addColumnIfNotExists('ai_config', 'enabled', 'INTEGER DEFAULT 0');
addColumnIfNotExists('knowledge_base', 'filePath', "TEXT NOT NULL DEFAULT ''");
addColumnIfNotExists('system_config', 'maintenanceMode', 'INTEGER DEFAULT 0');

// --- Seeding Logic ---
const seedIfEmpty = (tableName: string, query: string, params: any[] = []) => {
  const countRes = db.prepare(`SELECT COUNT(*) as count FROM ${tableName}`).get() as any;
  if (countRes.count === 0) {
    db.prepare(query).run(...params);
  }
};

seedIfEmpty('branding', `
  INSERT INTO branding (id, appName, appAcronym, loginDescription, copyright, theme)
  VALUES (1, 'Resource Inventory Management System', 'R.I.M.S', 
  'A specialized system for broadcast, media, and engineering departments to manage expenditures and resources with precision.',
  '© 2026 Resource Inventory Management System. All rights reserved.', 'oceanic')
`);

// One-time repair for installs that already seeded the previous default
// copyright text (with the old year baked in). Only touches the row if the
// copyright text still matches that exact untouched old default — if an
// admin has since edited it in Settings, this is skipped.
(() => {
  const OLD_DEFAULT_COPYRIGHT = '© 2025 Resource Inventory Management System. All rights reserved.';
  const row = db.prepare('SELECT copyright FROM branding WHERE id = 1').get() as { copyright: string } | undefined;
  if (row && row.copyright === OLD_DEFAULT_COPYRIGHT) {
    db.prepare('UPDATE branding SET copyright = ? WHERE id = 1')
      .run('© 2026 Resource Inventory Management System. All rights reserved.');
  }
})();

seedIfEmpty('system_config', `
  INSERT INTO system_config (id, maxUploadSize)
  VALUES (1, 20)
`);

seedIfEmpty('divisions', `
  INSERT INTO divisions (id, name) VALUES 
  ('office-of-the-head', 'Office of the Head'),
  ('operations-division', 'Operations Division'),
  ('technical-and-media-server-support-division', 'Technical and Media Server Support Division'),
  ('project-management-division', 'Project Management Division')
`);

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

const adminPasswordHash = bcrypt.hashSync('P@ssw0rd', 12);
const existingAdmin = db.prepare('SELECT * FROM users WHERE username = ?').get('admin') as any;
if (!existingAdmin) {
  db.prepare(`
    INSERT INTO users (id, username, password_hash, name, email, contactNumber, role, position, reportingTo, twoFactorEnabled, isStaffOnly)
    VALUES ('admin-001', 'admin', ?, 'RIMS Administrator', 'admin@rims.local', 'N/A', 'Admin', 'System Administrator', 'N/A', 0, 0)
  `).run(adminPasswordHash);
} else if (existingAdmin.email === 'admin') {
  // One-time repair: a prior version seeded an invalid email ('admin' instead of
  // a real address), which fails UserSchema's z.string().email() check on every
  // saveSystemData() call and silently blocks all user add/edit/delete operations.
  db.prepare(`UPDATE users SET email = 'admin@rims.local' WHERE id = 'admin-001'`).run();
}

seedIfEmpty('locations', `
  INSERT INTO locations (id, name) VALUES 
  ('4th-floor', '4th floor'),
  ('5th-floor', '5th floor'),
  ('6th-floor', '6th floor'),
  ('deployed', 'Deployed')
`);

seedIfEmpty('status_options', `
  INSERT INTO status_options (id, name) VALUES 
  ('working', 'working'),
  ('defective', 'defective'),
  ('turned-over', 'turned over to SAMD'),
  ('others', 'others:')
`);

seedIfEmpty('positions', `
  INSERT INTO positions (id, name) VALUES 
  ('vp', 'VP'),
  ('avp', 'AVP'),
  ('senior-manager', 'Senior Manager'),
  ('manager', 'Manager'),
  ('assistant-manager', 'Assistant Manager'),
  ('budget-officer', 'Budget Officer')
`);

// One-time repair for installs that already seeded the *previous* default
// position list before it changed. Only replaces the rows if the table
// still contains exactly the old default set untouched — if an admin has
// since added, removed, or renamed any position, this is skipped so their
// customizations are left alone.
(() => {
  const OLD_DEFAULT_IDS = ['assistant-manager', 'avp', 'section-head', 'senior-engineer', 'unit-head', 'vp'];
  const existingIds = (db.prepare('SELECT id FROM positions').all() as { id: string }[])
    .map(r => r.id)
    .sort();
  const isUntouchedOldDefault =
    existingIds.length === OLD_DEFAULT_IDS.length &&
    existingIds.every((id, i) => id === OLD_DEFAULT_IDS[i]);

  if (isUntouchedOldDefault) {
    const replace = db.transaction(() => {
      db.prepare('DELETE FROM positions').run();
      const insert = db.prepare('INSERT INTO positions (id, name) VALUES (@id, @name)');
      [
        { id: 'vp', name: 'VP' },
        { id: 'avp', name: 'AVP' },
        { id: 'senior-manager', name: 'Senior Manager' },
        { id: 'manager', name: 'Manager' },
        { id: 'assistant-manager', name: 'Assistant Manager' },
        { id: 'budget-officer', name: 'Budget Officer' },
      ].forEach(p => insert.run(p));
    });
    replace();
  }
})();

// --- Resource Logic ---
export async function getAllResources(): Promise<BudgetEntry[]> {
  const rows = db.prepare('SELECT * FROM resources ORDER BY createdAt DESC').all() as any[];
  return rows.map(row => {
    let attachments: string[] = [];
    try {
      attachments = row.attachments ? JSON.parse(row.attachments) : [];
      if (!Array.isArray(attachments)) attachments = [];
    } catch (e) {
      attachments = [];
    }
    return {
      ...row,
      unitCostActual: row.unitCostActual || 0,
      totalCostActual: row.totalCostActual || 0,
      attachments: attachments,
    };
  });
}

export async function saveResources(resources: BudgetEntry[]) {
  const deleteStmt = db.prepare('DELETE FROM resources');
  const insertStmt = db.prepare(`
    INSERT INTO resources (
      id, year, division, section, location, locationDetails, classification, category, account,
      projectTitle, itemDescription, quantity, unitCostBudget, totalCostBudget,
      unitCostActual, totalCostActual, prNumber, dateDelivered, grSisNumber,
      accountablePerson, status, statusOthers, remarks, attachments, createdAt
    ) VALUES (
      @id, @year, @division, @section, @location, @locationDetails, @classification, @category, @account,
      @projectTitle, @itemDescription, @quantity, @unitCostBudget, @totalCostBudget,
      @unitCostActual, @totalCostActual, @prNumber, @dateDelivered, @grSisNumber,
      @accountablePerson, @status, @statusOthers, @remarks, @attachments, @createdAt
    )
  `);

  const transaction = db.transaction((data: BudgetEntry[]) => {
    deleteStmt.run();
    for (const item of data) {
      insertStmt.run({
        ...item,
        attachments: JSON.stringify(item.attachments || [])
      });
    }
  });
  transaction(resources);
}

export async function deleteResourcesByYear(year: number) {
  db.prepare('DELETE FROM resources WHERE year = ?').run(year);
}

// --- Knowledge Base Logic ---
export async function getAllKnowledgeBaseEntries(): Promise<KnowledgeBaseEntry[]> {
  return db.prepare('SELECT * FROM knowledge_base ORDER BY createdAt DESC').all() as KnowledgeBaseEntry[];
}

export async function saveKnowledgeBaseEntry(entry: KnowledgeBaseEntry) {
  const stmt = db.prepare(`
    INSERT INTO knowledge_base (id, title, description, fileName, fileType, filePath, uploadedBy, createdAt)
    VALUES (@id, @title, @description, @fileName, @fileType, @filePath, @uploadedBy, @createdAt)
  `);
  stmt.run(entry);
}

export async function deleteKnowledgeBaseEntry(id: string) {
  db.prepare('DELETE FROM knowledge_base WHERE id = ?').run(id);
}

// --- User & Auth Logic ---
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

export async function getUserById(id: string): Promise<any | null> {
  return db.prepare('SELECT * FROM users WHERE id = ?').get(id) || null;
}

export async function saveUsers(users: User[]) {
  const currentRecords = db.prepare('SELECT id, username, password_hash, twoFactorSecret FROM users').all() as any[];
  const hashMap = new Map(currentRecords.map(r => [r.id, r.password_hash]));
  const secretMap = new Map(currentRecords.map(r => [r.id, r.twoFactorSecret]));
  const usernameMap = new Map(currentRecords.filter(r => r.username).map(r => [r.username, r.password_hash]));

  const upsertStmt = db.prepare(`
    INSERT INTO users (id, username, password_hash, name, email, contactNumber, role, section, division, twoFactorEnabled, twoFactorSecret, position, reportingTo, isStaffOnly, profilePicture)
    VALUES (@id, @username, @password_hash, @name, @email, @contactNumber, @role, @section, @division, @twoFactorEnabled, @twoFactorSecret, @position, @reportingTo, @isStaffOnly, @profilePicture)
    ON CONFLICT(id) DO UPDATE SET
      username=excluded.username, name=excluded.name, email=excluded.email,
      contactNumber=excluded.contactNumber, role=excluded.role, section=excluded.section,
      division=excluded.division, twoFactorEnabled=excluded.twoFactorEnabled,
      position=excluded.position, reportingTo=excluded.reportingTo,
      isStaffOnly=excluded.isStaffOnly, profilePicture=excluded.profilePicture
  `);

  // Also delete users that are no longer in the payload (except admin)
  const deleteStmt = db.prepare('DELETE FROM users WHERE id = ? AND username != ?');

  const transactionSafe = db.transaction((data: User[]) => {
    const incomingIds = new Set(data.map(u => u.username === 'admin' ? 'admin-001' : u.id));

    // Delete removed users
    for (const record of currentRecords) {
      if (!incomingIds.has(record.id) && record.username !== 'admin') {
        deleteStmt.run(record.id, 'admin');
      }
    }

    for (const user of data) {
      const existingHash = hashMap.get(user.id) || (user.username ? usernameMap.get(user.username) : null);
      const existingSecret = secretMap.get(user.id);

      const payload = {
        ...user,
        id: user.username === 'admin' ? 'admin-001' : user.id,
        username: user.username || null,
        password_hash: existingHash || DEFAULT_PASSWORD_HASH,
        twoFactorEnabled: user.twoFactorEnabled ? 1 : 0,
        twoFactorSecret: user.twoFactorSecret === null ? null : (user.twoFactorSecret || existingSecret || null),
        isStaffOnly: user.isStaffOnly ? 1 : 0,
        profilePicture: user.profilePicture || null,
        email: user.email || null,
        contactNumber: user.contactNumber || null,
        position: user.position || null,
        reportingTo: user.reportingTo || null,
        section: user.section || null,
        division: user.division || null
      };
      upsertStmt.run(payload);
    }
  });
  transactionSafe(users);
}

export async function updateUserPassword(userId: string, hash: string) {
  db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(hash, userId);
}

export async function updateTwoFactor(userId: string, enabled: boolean, secret: string | null) {
  db.prepare('UPDATE users SET twoFactorEnabled = ?, twoFactorSecret = ? WHERE id = ?').run(enabled ? 1 : 0, secret, userId);
}

// --- System Updates Logic ---
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

// --- Global Data Getters/Setters ---
export async function getAllDivisions(): Promise<Division[]> {
  return db.prepare('SELECT * FROM divisions').all() as Division[];
}

export async function saveDivisions(divisions: Division[]) {
  const deleteStmt = db.prepare('DELETE FROM divisions');
  const insertStmt = db.prepare('INSERT INTO divisions (id, name) VALUES (@id, @name)');
  const trans = db.transaction((d: any[]) => { deleteStmt.run(); d.forEach(i => insertStmt.run(i)); });
  trans(divisions);
}

export async function getAllSections(): Promise<Section[]> {
  return db.prepare('SELECT * FROM sections').all() as Section[];
}

export async function saveSections(sections: Section[]) {
  const deleteStmt = db.prepare('DELETE FROM sections');
  const insertStmt = db.prepare('INSERT INTO sections (id, name, divisionId) VALUES (@id, @name, @divisionId)');
  const trans = db.transaction((d: any[]) => { deleteStmt.run(); d.forEach(i => insertStmt.run(i)); });
  trans(sections);
}

export async function getAllLocations(): Promise<Location[]> {
  return db.prepare('SELECT * FROM locations').all() as Location[];
}

export async function saveLocations(locations: Location[]) {
  const deleteStmt = db.prepare('DELETE FROM locations');
  const insertStmt = db.prepare('INSERT INTO locations (id, name) VALUES (@id, @name)');
  const trans = db.transaction((d: any[]) => { deleteStmt.run(); d.forEach(i => insertStmt.run(i)); });
  trans(locations);
}

export async function getAllStatusOptions(): Promise<StatusOption[]> {
  return db.prepare('SELECT * FROM status_options').all() as StatusOption[];
}

export async function saveStatusOptions(options: StatusOption[]) {
  const deleteStmt = db.prepare('DELETE FROM status_options');
  const insertStmt = db.prepare('INSERT INTO status_options (id, name) VALUES (@id, @name)');
  const trans = db.transaction((d: any[]) => { deleteStmt.run(); d.forEach(i => insertStmt.run(i)); });
  trans(options);
}

export async function getAllPositions(): Promise<Position[]> {
  return db.prepare('SELECT * FROM positions').all() as Position[];
}

export async function savePositions(positions: Position[]) {
  const deleteStmt = db.prepare('DELETE FROM positions');
  const insertStmt = db.prepare('INSERT INTO positions (id, name) VALUES (@id, @name)');
  const trans = db.transaction((d: any[]) => { deleteStmt.run(); d.forEach(i => insertStmt.run(i)); });
  trans(positions);
}

export async function getBranding(): Promise<BrandingConfig> {
  const row = db.prepare('SELECT * FROM branding WHERE id = 1').get() as any;
  if (!row) {
    return {
      appName: 'Resource Inventory Management System',
      appAcronym: 'R.I.M.S',
      loginDescription: 'A specialized system for broadcast, media, and engineering departments to manage expenditures and resources with precision.',
      copyright: '© 2026 Resource Inventory Management System. All rights reserved.',
      theme: 'oceanic',
    };
  }
  const { darkMode, ...rest } = row;
  return rest;
}

export async function saveBranding(branding: BrandingConfig) {
  db.prepare(`
    UPDATE branding SET
      appName = @appName,
      appAcronym = @appAcronym,
      loginDescription = @loginDescription,
      copyright = @copyright,
      logoUrl = @logoUrl,
      theme = @theme
    WHERE id = 1
  `).run(branding);
}

export async function getSystemConfig(): Promise<SystemConfig> {
  const row = db.prepare('SELECT * FROM system_config WHERE id = 1').get() as any;
  if (!row) return { maxUploadSize: 20, maintenanceMode: false };
  return {
    maxUploadSize: row.maxUploadSize || 20,
    maintenanceMode: !!row.maintenanceMode,
  };
}

export async function saveSystemConfig(config: SystemConfig) {
  db.prepare(`
    UPDATE system_config SET
      maxUploadSize = @maxUploadSize,
      maintenanceMode = @maintenanceMode
    WHERE id = 1
  `).run({ ...config, maintenanceMode: config.maintenanceMode ? 1 : 0 });
}

// Lightweight check — no auth required, used on login page
export function getMaintenanceModeSync(): boolean {
  try {
    const row = db.prepare('SELECT maintenanceMode FROM system_config WHERE id = 1').get() as any;
    return !!row?.maintenanceMode;
  } catch {
    return false;
  }
}

export async function getSmtpConfig(): Promise<SmtpConfig | null> {
  const row = db.prepare('SELECT * FROM smtp_settings WHERE id = 1').get() as any;
  if (!row) return null;
  return {
    ...row,
    secure: !!row.secure,
    fromName: row.fromName || '',
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
        fromName = @fromName,
        secure = @secure
      WHERE id = 1
    `).run(params);
  } else {
    db.prepare(`
      INSERT INTO smtp_settings (id, host, port, user, pass, fromEmail, fromName, secure)
      VALUES (1, @host, @port, @user, @pass, @fromEmail, @fromName, @secure)
    `).run(params);
  }
}

// --- AI Config ---
export async function getAiConfig(): Promise<import('./types').AiConfig> {
  const row = db.prepare('SELECT * FROM ai_config WHERE id = 1').get() as any;
  if (!row) {
    return { provider: 'anthropic', apiKey: '', model: 'claude-sonnet-4-20250514', ollamaBaseUrl: 'http://localhost:11434', enabled: false };
  }
  return { ...row, enabled: !!row.enabled };
}

export async function saveAiConfig(config: import('./types').AiConfig) {
  const existing = db.prepare('SELECT id FROM ai_config WHERE id = 1').get();
  const params = { ...config, enabled: config.enabled ? 1 : 0 };
  if (existing) {
    db.prepare('UPDATE ai_config SET provider=@provider, apiKey=@apiKey, model=@model, ollamaBaseUrl=@ollamaBaseUrl, enabled=@enabled WHERE id=1').run(params);
  } else {
    db.prepare('INSERT INTO ai_config (id, provider, apiKey, model, ollamaBaseUrl, enabled) VALUES (1, @provider, @apiKey, @model, @ollamaBaseUrl, @enabled)').run(params);
  }
}

export async function getAllLockedYears(): Promise<LockedYear[]> {
  return db.prepare('SELECT year FROM locked_years ORDER BY year DESC').all() as LockedYear[];
}

export async function saveLockedYears(years: LockedYear[]) {
  const deleteStmt = db.prepare('DELETE FROM locked_years');
  const insertStmt = db.prepare('INSERT INTO locked_years (year) VALUES (@year)');
  const trans = db.transaction((d: LockedYear[]) => {
    deleteStmt.run();
    d.forEach(i => insertStmt.run(i));
  });
  trans(years);
}
