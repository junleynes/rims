# R.I.M.S — Application Blueprint

## Overview

Resource Inventory Management System (R.I.M.S) is a self-hosted, full-stack web application built for broadcast, media, and engineering departments. It manages CAPEX/OPEX budget lifecycle, IT resource inventory, organizational structure, and knowledge management — with AI-powered features for anomaly detection and report generation.

---

## Core Modules

### 1. Authentication & Security
- httpOnly iron-session cookie sessions (server-side verified)
- bcryptjs password hashing (cost factor 12)
- TOTP 2FA via otplib, QR code enrollment
- Brute-force lockout: 5 attempts / 15-minute cooldown
- Role enforcement at server layout level (not just UI)
- Admin-only server actions protected via `requireAdmin()`

### 2. Budget & Resource Management
- CAPEX / OPEX entry with full metadata (PR number, delivery date, GR/SIS, accountable person)
- Per-item status tracking: working, defective, turned over to SAMD, others
- File attachments per budget entry
- Fiscal year locking (prevents edits to closed years)
- CSV import/export
- Bulk operations

### 3. AI Integration
- **Provider abstraction:** Anthropic, OpenAI, Ollama — switchable from Admin Settings
- **Anomaly Detection:** Rule-based engine (always on) + AI enrichment (when enabled)
  - Overrun > 20% of budget
  - Unit cost magnitude errors (100x ratio)
  - Delivered items with ₱0 actual
- **Narrative Report Generation:** Executive summary from live report filters
- **Budget Autofill:** AI-suggested project titles and descriptions (wired via settings)
- AI config stored in SQLite, API key never exposed to client

### 4. Analytics Dashboard
- Total budget vs actual utilization
- CAPEX / OPEX split
- Section-level and division-level breakdowns
- Recharts bar and pie charts

### 5. Admin Panel (Admin role only)
- User management (CRUD, role assignment, 2FA reset)
- Org structure: divisions, sections, locations, positions
- System branding (app name, logo, theme, financial year)
- SMTP email configuration with test send
- AI provider configuration with connection test
- System announcements/updates
- Database maintenance (export, import)
- Fiscal year locking

### 6. Knowledge Base
- Upload PDF/document files (base64 stored in SQLite)
- Tag and categorize entries
- Searchable index

### 7. Table of Organization
- Division → Section hierarchy
- Staff listings per section
- Reporting line visualization

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript |
| Database | SQLite (better-sqlite3, WAL mode) |
| Auth | iron-session + bcryptjs + otplib |
| UI | shadcn/ui + Tailwind CSS |
| Charts | Recharts |
| AI | Anthropic / OpenAI / Ollama |
| Deployment | Linux + systemd + Nginx (HTTPS) |

---

## Role Matrix

| Feature | Viewer | Manager | AVP | VP | Admin |
|---|---|---|---|---|---|
| View own section data | ✓ | ✓ | ✓ | ✓ | ✓ |
| View all data | | | ✓ | ✓ | ✓ |
| Add/edit budget entries | | ✓ | ✓ | ✓ | ✓ |
| Reports & AI features | | ✓ | ✓ | ✓ | ✓ |
| Admin panel | | | | | ✓ |

---

## Default Seed Data

- **Divisions:** Office of the Head, Operations, Technical & Media Server Support, Project Management
- **Sections:** 16 sections mapped to divisions
- **Locations:** 4th floor, 5th floor, 6th floor, Deployed
- **Status options:** working, defective, turned over to SAMD, others
- **Admin user:** `admin@rims.local` / `P@ssw0rd`
