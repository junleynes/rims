#!/usr/bin/env node
/**
 * RIMS Default Admin Seed Script
 * Usage: node scripts/seed-admin.js
 * Run from the project root: /var/www/rims
 */

const bcrypt = require('bcryptjs');
const path = require('path');
const Database = require('better-sqlite3');
const crypto = require('crypto');

const DB_PATH = path.join(process.cwd(), 'data.db');

console.log(`Opening database at: ${DB_PATH}`);
const db = new Database(DB_PATH);

// Enable WAL mode
db.pragma('journal_mode = WAL');

const USERNAME = 'admin.rims.local';
const PASSWORD = 'P@ssw0rd';
const HASH = bcrypt.hashSync(PASSWORD, 12);
const ID = crypto.randomUUID();

// Check if user already exists
const existing = db.prepare("SELECT id, username FROM users WHERE username = ?").get(USERNAME);

if (existing) {
  // Update existing
  db.prepare(`
    UPDATE users SET
      password_hash = ?,
      role = 'Admin',
      name = 'RIMS Administrator'
    WHERE username = ?
  `).run(HASH, USERNAME);
  console.log(`✓ Updated existing user: ${USERNAME}`);
} else {
  // Insert new
  db.prepare(`
    INSERT INTO users (id, name, username, password_hash, role, division, section, twoFactorEnabled)
    VALUES (?, 'RIMS Administrator', ?, ?, 'Admin', '', '', 0)
  `).run(ID, USERNAME, HASH);
  console.log(`✓ Created new admin user: ${USERNAME}`);
}

console.log('');
console.log('Default credentials:');
console.log(`  Username : ${USERNAME}`);
console.log(`  Password : ${PASSWORD}`);
console.log('');
console.log('Please change the password after first login.');

db.close();
