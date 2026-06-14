'use server';

import * as db from '@/lib/server-db';
import { callAi } from '@/lib/ai-provider';
import { requireSession } from '@/lib/session';

export async function autofillBudgetFields(params: {
  category: string;
  classification: string;
  account: string;
  projectTitle?: string;
}): Promise<{ projectTitle?: string; itemDescription?: string; error?: string }> {
  await requireSession();
  const config = await db.getAiConfig();

  if (!config.enabled) {
    return { error: 'AI is not enabled. Go to Admin → Settings → AI to configure it.' };
  }

  const { category, classification, account, projectTitle } = params;

  // If user already typed a project title — generate description only from that
  if (projectTitle && projectTitle.trim().length > 3) {
    const prompt = `You are helping fill out a budget entry form for a broadcast/media organization's IT resource management system (Philippine setting, amounts in PHP).

The user has entered this project/item name: "${projectTitle}"
Category: ${category}
Classification: ${classification}
Account: ${account}

Generate a detailed technical item description for this specific item. Include:
- What it is and its purpose
- Suggested brand/model (realistic for Philippine IT procurement)
- Key technical specifications
- Why it fits this category/classification

Respond ONLY with a JSON object:
{
  "itemDescription": "2-3 sentence technical description"
}

No markdown, no preamble, only the JSON.`;

    try {
      const response = await callAi(config, [{ role: 'user', content: prompt }]);
      const clean = response.replace(/```json|```/g, '').trim();
      const parsed = JSON.parse(clean);
      return { itemDescription: parsed.itemDescription ?? undefined };
    } catch (err: any) {
      return { error: err.message ?? 'AI description generation failed.' };
    }
  }

  // No title provided — generate both project title and description
  const prompt = `You are helping fill out a budget entry form for a broadcast/media organization's IT resource management system (Philippine setting, amounts in PHP).

Given:
- Category: ${category}
- Classification: ${classification}
- Account/Sub-category: ${account}

Generate a realistic budget entry. Respond ONLY with a valid JSON object:
{
  "projectTitle": "concise professional item name (max 8 words)",
  "itemDescription": "detailed technical description including brand/model suggestions, specifications, and purpose (2-3 sentences)"
}

No markdown, no preamble, only the JSON object.`;

  try {
    const response = await callAi(config, [{ role: 'user', content: prompt }]);
    const clean = response.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(clean);
    return {
      projectTitle: parsed.projectTitle ?? undefined,
      itemDescription: parsed.itemDescription ?? undefined,
    };
  } catch (err: any) {
    return { error: err.message ?? 'AI autofill failed. Try again.' };
  }
}
