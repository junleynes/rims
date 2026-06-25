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
- **Centralized Knowledge Base** — Upload, manage, and access SOPs, technical manuals, and policy documents (PDF, Word, PowerPoint)
- **Table of Organization** — Interactive org chart with horizontal/vertical orientation, drag-to-pan, and zoom
- **Multi-Factor Authentication** — TOTP 2FA via Google Authenticator, enforceable per user
- **Secure Session Management** — httpOnly iron-session cookies with brute-force lockout
- **Audit Log** — Granular event tracking across auth, personnel, budget, knowledge base, and system actions
- **Admin Settings** — Branding, SMTP email, AI provider config, and locked fiscal years

---

## Tech Stack

- **Framework:** Next.js 15 (App Router, Server Actions)
- **Database:** SQLite via better-sqlite3 (WAL mode)
- **Auth:** iron-session (httpOnly cookies) + bcryptjs + otplib (TOTP)
- **UI:** shadcn/ui + Tailwind CSS + Recharts
- **AI:** Anthropic Claude / OpenAI / OpenRouter / Ollama (configurable)
- **File Storage:** Local filesystem (`uploads/` directory, served via authenticated API route)

---

## Getting Started

### Prerequisites

- Node.js 18+
- A Linux server (Ubuntu recommended) behind a reverse proxy (Apache or Nginx)

### Installation

```bash
git clone https://github.com/junleynes/rims.git
cd rims
npm install
```

Create `.env.local` at the project root:

```env
# Required — generate with:
# node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
SESSION_SECRET=your_64_char_hex_secret_here

# Set to false when running over HTTP (LAN without HTTPS)
# Set to true when behind HTTPS reverse proxy
COOKIE_SECURE=false

NODE_ENV=production
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
Environment="COOKIE_SECURE=false"

[Install]
WantedBy=multi-user.target
```

---

## Reverse Proxy (Apache)

```apache
<VirtualHost *:7777>
    ServerName your-server-ip-or-domain

    ProxyPreserveHost On
    ProxyRequests Off

    RequestHeader set X-Forwarded-Proto "http"
    RequestHeader set X-Real-IP %{REMOTE_ADDR}s

    <Proxy *>
        Require all granted
    </Proxy>

    ProxyPass / http://localhost:7777/
    ProxyPassReverse / http://localhost:7777/
    ProxyPassReverseCookiePath / /

    ErrorLog ${APACHE_LOG_DIR}/rims_error.log
    CustomLog ${APACHE_LOG_DIR}/rims_access.log combined
</VirtualHost>
```

Enable required modules:

```bash
sudo a2enmod proxy proxy_http headers
sudo systemctl restart apache2
```

---

## AI Configuration

Go to **Admin → Settings → AI Integration** to configure your AI provider:

- **Anthropic** — Claude Sonnet (recommended for best results)
- **OpenAI** — GPT-4o
- **OpenRouter** — Access multiple models (Claude, GPT, Gemini, Mistral, etc.) via a single API key at [openrouter.ai](https://openrouter.ai)
- **Ollama** — Fully local, self-hosted models (Llama 3, Mistral, Phi, etc.) — no internet required

---

## License

Proprietary — Internal use only.
