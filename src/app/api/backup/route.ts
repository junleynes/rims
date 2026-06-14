import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/session';
import { exec } from 'child_process';
import { promisify } from 'util';
import { existsSync, mkdirSync, writeFileSync, unlinkSync, readFileSync } from 'fs';
import path from 'path';
import * as db from '@/lib/server-db';

const execAsync = promisify(exec);
const ROOT = process.cwd();
const TMP_DIR = path.join(ROOT, '.backup-tmp');

export async function GET(req: NextRequest) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const date = new Date().toISOString().split('T')[0];
  const zipName = `rims-backup-${date}.zip`;
  const zipPath = path.join(TMP_DIR, zipName);

  try {
    // Ensure tmp dir exists
    if (!existsSync(TMP_DIR)) mkdirSync(TMP_DIR, { recursive: true });

    // Write settings JSON into tmp dir
    const [branding, systemConfig, smtp, aiConfig] = await Promise.all([
      db.getBranding(),
      db.getSystemConfig(),
      db.getSmtpConfig(),
      db.getAiConfig(),
    ]);

    const settings = {
      exportedAt: new Date().toISOString(),
      version: '1.0',
      branding,
      systemConfig,
      smtp: { ...smtp, password: '[REDACTED]' }, // never backup plaintext SMTP password
      aiConfig: { ...aiConfig, apiKey: '[REDACTED]' }, // never backup API keys
    };

    const settingsPath = path.join(TMP_DIR, 'settings.json');
    writeFileSync(settingsPath, JSON.stringify(settings, null, 2));

    // Build zip — include DB, uploads, settings
    const dbPath = path.join(ROOT, 'data.db');
    const uploadsPath = path.join(ROOT, 'uploads');

    const parts: string[] = [];

    // Add settings.json from tmp
    parts.push(`-j "${settingsPath}"`); // -j = junk paths (flat in zip)

    // Add data.db if it exists
    if (existsSync(dbPath)) {
      parts.push(`-j "${dbPath}"`);
    }

    // Add uploads directory if it exists
    if (existsSync(uploadsPath)) {
      parts.push(`"${uploadsPath}"`);
    }

    const cmd = `zip -r "${zipPath}" ${parts.join(' ')}`;
    await execAsync(cmd);

    // Read the zip and stream it back
    const zipBuffer = readFileSync(zipPath);

    // Cleanup tmp files
    try {
      unlinkSync(settingsPath);
      unlinkSync(zipPath);
    } catch { /* best effort */ }

    return new NextResponse(zipBuffer, {
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${zipName}"`,
        'Content-Length': zipBuffer.length.toString(),
        'Cache-Control': 'no-store',
      },
    });

  } catch (err: any) {
    // Cleanup on error
    try { if (existsSync(zipPath)) unlinkSync(zipPath); } catch { /* ignore */ }
    console.error('Backup error:', err);
    return NextResponse.json({ error: `Backup failed: ${err.message}` }, { status: 500 });
  }
}
