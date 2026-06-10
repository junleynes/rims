import { NextRequest, NextResponse } from 'next/server';
import { callAi } from '@/lib/ai-provider';
import type { AiConfig } from '@/lib/types';

export async function POST(req: NextRequest) {
  try {
    const config: AiConfig = await req.json();
    const reply = await callAi(
      { ...config, enabled: true },
      [{ role: 'user', content: 'Reply with exactly: "RIMS AI connection OK"' }]
    );
    return NextResponse.json({ ok: true, reply: reply.trim().slice(0, 80) });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message ?? 'Unknown error' }, { status: 200 });
  }
}
