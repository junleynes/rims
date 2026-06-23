# R.I.M.S — Resource Inventory Management System

A secure, self-hosted web application for broadcast, media, and engineering departments to manage IT resources, CAPEX/OPEX budgets, and organizational data with precision.

---

## Features

- **Role-Based Access Control** — Admin, Manager, AVP, VP, and Viewer roles with server-enforced data filtering
- **Budget & Resource Management** — Full CAPEX/OPEX lifecycle tracking from procurement to SAMD turnover
- **Real-Time Analytics Dashboard** — CAPEX/OPEX breakdowns, utilization rates, and section-level summaries
- **AI Anomaly Detection** — Automatically flags budget overruns, unit cost magnitude errors, and missing actuals
- **AI Budget Autofill** — Intelligent field suggestions for project titles and item descriptions
- **AI Narrative Reports** — Executive-ready summaries generated from live report data for VP/AVP briefings
- **Centralized Knowledge Base** — Upload and access SOPs, technical manuals, and policy documents (PDF, Word, PowerPoint)
- **Table of Organization** — Division and section org chart with reporting line mapping
- **Multi-Factor Authentication** — TOTP 2FA via Google Authenticator, enforceable per user
- **Secure Session Management** — httpOnly iron-session cookies with brute-force lockout
- **Admin Settings** — Branding, SMTP email, AI provider config (Anthropic / OpenAI / Ollama), locked fiscal years

---

## Tech Stack

- **Framework:** Next.js 15 (App Router, Server Actions)
- **Database:** SQLite via better-sqlite3 (WAL mode)
- **Auth:** iron-session (httpOnly cookies) + bcryptjs + otplib (TOTP)
- **UI:** shadcn/ui + Tailwind CSS + Recharts
- **AI:** Anthropic Claude / OpenAI / Ollama (configurable)
- **File Storage:** Local filesystem (`uploads/` directory, served via authenticated API route)

---

## Getting Started

### Prerequisites

- Node.js 18+
- A Linux server (Ubuntu recommended) behind an Nginx HTTPS reverse proxy

### Installation

```bash
git clone https://github.com/junleynes/rims.git
cd rims
npm install
cp .env.local.example .env.local
```

Edit `.env.local`:

```env
SESSION_SECRET=<generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))">
```

### Build & Run

```bash
npm run build
npm start          # runs on port 7777
```

### Default Credentials

| Field    | Value              |
|----------|--------------------|
| Username | `admin@rims.local` |
| Password | `P@ssw0rd`         |

> **Change the password immediately after first login.**

---

## Systemd Service

```ini
[Unit]
Description=RIMS Node App
After=network.target

[Service]
Type=simple
WorkingDirectory=/var/www/rims
ExecStart=/usr/bin/npm run start
Restart=always
RestartSec=5
User=rims
Environment=NODE_ENV=production
Environment="SESSION_SECRET=your-secret-here"

[Install]
WantedBy=multi-user.target
```

---

## File Uploads & Knowledge Base

Files uploaded to the Knowledge Base are stored in the `uploads/knowledge-base/` directory at the project root (outside `public/` so they are **not** directly URL-accessible). All downloads are served through the authenticated `/api/files-serve` route, which verifies the user's session before streaming the file.

### How upload works (two-phase)

1. **Stage** — When the Admin selects a file, it is immediately sent to `/api/upload` and written to disk. A "Ready" indicator appears next to the file input. The Publish button stays disabled until this completes.
2. **Publish** — Clicking *Publish to Repository* writes the metadata (title, description, stored path) to the SQLite database. If the file has not finished staging, the form blocks submission.

This two-phase approach prevents the stale-closure race condition that could cause the file path to be missing on submit.

### Supported formats

PDF, Word (`.doc`, `.docx`), PowerPoint (`.ppt`, `.pptx`)

### Size limit

Configurable by an Admin under **Settings → System → Max Upload Size** (default 20 MB). Enforced both client-side and server-side.

---

## AI Configuration

Go to **Admin → Settings → AI Integration** to configure your AI provider:

- **Anthropic** — Claude Sonnet (recommended)
- **OpenAI** — GPT-4o
- **Ollama** — Local self-hosted models (Llama 3, Mistral, etc.)

---

## Changelog

### v1.x — Knowledge Base upload fix

- **Bug fix:** Resolved a stale React closure race condition in `knowledge-base/page.tsx` where `formData` captured in the `handleUpload` closure could be empty if the async file upload hadn't flushed to state yet before the user clicked *Publish*.
- **Fix:** Upload result (file path, name, type) is now stored in a `useRef` (`uploadedFileRef`) instead of relying on the React state snapshot inside the submit handler. This guarantees the latest upload result is always available at publish time.
- **UX improvement:** The Publish button is now disabled while a file is uploading (`isUploading`) and also while the form is saving (`isPublishing`), with matching button label changes ("Uploading…" / "Publishing…"). A "Ready" badge appears next to the file input once staging succeeds.
- **Cancel clears state:** Clicking Cancel now resets the file input, clears the ref, and resets the `fileReady` flag.

---

## License

Proprietary — Internal use only.
