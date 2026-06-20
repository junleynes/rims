'use server';

import * as db from '@/lib/server-db';
import { callAi } from '@/lib/ai-provider';
import { requireSession } from '@/lib/session';
import { checkRateLimit } from '@/lib/rate-limit';

export async function autofillBudgetFields(params: {
  category: string;
  classification: string;
  account: string;
  projectTitle: string;
}): Promise<{ itemDescription?: string; error?: string }> {
  const user = await requireSession();

  const { category, classification, account, projectTitle } = params;

  if (!projectTitle?.trim()) {
    return { error: 'Enter a project name or item first.' };
  }

  const config = await db.getAiConfig();
  if (!config.enabled) {
    return { error: 'AI is not enabled. Go to Admin → Settings → AI to configure it.' };
  }

  const rateLimit = checkRateLimit(`ai:${user.id}`, 15, 5 * 60 * 1000);
  if (!rateLimit.allowed) {
    return { error: `Too many AI requests. Try again in ${rateLimit.retryAfterSeconds}s.` };
  }

  const prompt = `You are helping fill out a budget entry form for a broadcast/media organization's IT resource management system (Philippine setting).

Item/Project: "${projectTitle}"
Category: ${category}
Classification: ${classification}
Account: ${account}

Write a detailed technical item description for procurement purposes. Include:
- What it is and its specific purpose in a broadcast/media environment
- Suggested brand and model (realistic for Philippine IT procurement, e.g. Dell, HP, Cisco, Ubiquiti, etc.)
- Key technical specifications relevant to the item type
- How it fits the ${category} ${classification} classification

Keep it to 2-3 sentences, professional and specific.

Respond ONLY with a JSON object:
{"itemDescription": "your description here"}

No markdown, no preamble.`;

  try {
    const response = await callAi(config, [{ role: 'user', content: prompt }]);
    const clean = response.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(clean);
    return { itemDescription: parsed.itemDescription ?? undefined };
  } catch (err: any) {
    return { error: err.message ?? 'AI generation failed. Try again.' };
  }
}

export async function generateContentFromTitle(params: {
  title: string;
  context: 'announcement' | 'knowledge-base';
  type?: string; // e.g. "Info", "Alert", "Feature" for announcements
}): Promise<{ content?: string; error?: string }> {
  const user = await requireSession();

  const { title, context, type } = params;

  if (!title?.trim()) {
    return { error: 'Enter a title first.' };
  }

  const config = await db.getAiConfig();
  if (!config.enabled) {
    return { error: 'AI is not enabled. Go to Admin → Settings → AI to configure it.' };
  }

  const rateLimit = checkRateLimit(`ai:${user.id}`, 15, 5 * 60 * 1000);
  if (!rateLimit.allowed) {
    return { error: `Too many AI requests. Try again in ${rateLimit.retryAfterSeconds}s.` };
  }

  let prompt = '';

  if (context === 'announcement') {
    prompt = `You are writing a system announcement for a broadcast/media organization's internal IT resource management system (R.I.M.S).

Announcement title: "${title}"
Announcement type: ${type ?? 'Info'}

Write a concise, professional announcement body (2-4 sentences) that:
- Elaborates on the headline with relevant details
- Uses clear, direct language appropriate for internal IT communications
- Includes any relevant action items or deadlines if implied by the title
- Matches the tone: ${type === 'Alert' ? 'urgent and clear' : type === 'Feature' ? 'informative and positive' : 'neutral and professional'}

Respond ONLY with JSON: {"content": "your announcement body here"}`;
  } else {
    prompt = `You are writing a document description for an internal knowledge base in a broadcast/media organization's IT resource management system (R.I.M.S).

Document title: "${title}"

Write a concise description (2-3 sentences) that:
- Summarizes what this document covers
- States who would find it useful (e.g. IT staff, section heads, etc.)
- Mentions what type of document it likely is (SOP, manual, guide, policy, etc.)

Respond ONLY with JSON: {"content": "your description here"}`;
  }

  try {
    const response = await callAi(config, [{ role: 'user', content: prompt }]);
    const clean = response.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(clean);
    return { content: parsed.content ?? undefined };
  } catch (err: any) {
    return { error: err.message ?? 'AI generation failed.' };
  }
}
