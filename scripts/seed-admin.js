#!/usr/bin/env node
/**
 * RIMS Default Admin Seed Script
 * Usage: node scripts/seed-admin.js
 * Run from project root with the service stopped.
 */

const bcrypt = require('bcryptjs');
const path = require('path');
const Database = require('better-sqlite3');
const crypto = require('crypto');

const DB_PATH = path.join(process.cwd(), 'data.db');
console.log(`Opening database at: ${DB_PATH}`);

const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');

const USERNAME = 'admin.rims.local';
const PASSWORD = 'P@ssw0rd';
const HASH = bcrypt.hashSync(PASSWORD, 12);
const ID = crypto.randomUUID();

const existing = db.prepare('SELECT id FROM users WHERE username = ?').get(USERNAME);

if (existing) {
  db.prepare(`UPDATE users SET password_hash = ?, role = 'Admin', name = 'RIMS Administrator' WHERE username = ?`).run(HASH, USERNAME);
  console.log(`✓ Updated: ${USERNAME}`);
} else {
  db.prepare(`
    INSERT INTO users (id, name, username, password_hash, role, division, section, twoFactorEnabled, isStaffOnly, email, contactNumber, position, reportingTo)
    VALUES (?, 'RIMS Administrator', ?, ?, 'Admin', '', '', 0, 0, 'admin@rims.local', 'N/A', 'System Administrator', 'N/A')
  `).run(ID, USERNAME, HASH);
  console.log(`✓ Created: ${USERNAME}`);
}

console.log('\nDefault credentials:');
console.log(`  Username : ${USERNAME}`);
console.log(`  Password : ${PASSWORD}`);
console.log('\nChange the password after first login.');
db.close();
