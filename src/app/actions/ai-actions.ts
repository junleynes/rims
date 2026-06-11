'use server';

import * as db from '@/lib/server-db';
import { callAi } from '@/lib/ai-provider';
import { requireSession } from '@/lib/session';
import type { BudgetEntry } from '@/lib/types';

export interface AnomalyFlag {
  id: string;
  projectTitle: string;
  section: string;
  category: string;
  reason: string;
  severity: 'high' | 'medium' | 'low';
  budgeted: number;
  actual: number;
}

export async function detectAnomalies(budgets: BudgetEntry[]): Promise<{ flags: AnomalyFlag[]; error?: string }> {
  await requireSession();
  const config = await db.getAiConfig();

  // Run rule-based detection first (works even without AI)
  const ruleFlags: AnomalyFlag[] = [];

  for (const b of budgets) {
    const actual = b.totalCostActual ?? 0;
    const budget = b.totalCostBudget ?? 0;

    if (budget === 0) continue;

    const overrunPct = (actual - budget) / budget;
    const unitActual = b.unitCostActual ?? 0;
    const unitBudget = b.unitCostBudget ?? 0;

    // Overrun > 20%
    if (overrunPct > 0.2 && actual > 0) {
      ruleFlags.push({
        id: b.id,
        projectTitle: b.projectTitle,
        section: b.section,
        category: b.category,
        budgeted: budget,
        actual,
        severity: overrunPct > 0.5 ? 'high' : 'medium',
        reason: `Actual spend is ${(overrunPct * 100).toFixed(0)}% over budget (₱${actual.toLocaleString()} vs ₱${budget.toLocaleString()}).`,
      });
    }

    // Unit cost looks like a magnitude error (e.g. ₱1 budgeted vs ₱1,000 actual)
    if (unitBudget > 0 && unitActual > 0) {
      const ratio = Math.max(unitActual / unitBudget, unitBudget / unitActual);
      if (ratio > 100) {
        ruleFlags.push({
          id: b.id,
          projectTitle: b.projectTitle,
          section: b.section,
          category: b.category,
          budgeted: budget,
          actual,
          severity: 'high',
          reason: `Unit cost mismatch — budgeted ₱${unitBudget.toLocaleString()} vs actual ₱${unitActual.toLocaleString()} (${ratio.toFixed(0)}x difference). Possible data entry error.`,
        });
      }
    }

    // Zero actual on a delivered item
    if (b.dateDelivered && actual === 0) {
      ruleFlags.push({
        id: b.id,
        projectTitle: b.projectTitle,
        section: b.section,
        category: b.category,
        budgeted: budget,
        actual,
        severity: 'low',
        reason: `Item is marked as delivered but has ₱0 actual cost. Actual expenditure may not have been recorded.`,
      });
    }
  }

  // If AI is enabled, enrich the top flags with narrative context
  if (config.enabled && ruleFlags.length > 0) {
    try {
      const topFlags = ruleFlags.slice(0, 10);
      const flagSummary = topFlags
        .map((f, i) => `${i + 1}. "${f.projectTitle}" (${f.category}, ${f.section}): ${f.reason}`)
        .join('\n');

      const prompt = `You are a budget analyst. Below are anomaly flags found in a resource budget system. For each one, provide a concise one-sentence business context or risk implication (not just restating the number). Keep each response under 20 words. Return ONLY a JSON array of strings, one per flag, in the same order.\n\nFlags:\n${flagSummary}`;

      const aiResponse = await callAi(config, [{ role: 'user', content: prompt }]);
      const clean = aiResponse.replace(/```json|```/g, '').trim();
      const insights: string[] = JSON.parse(clean);

      topFlags.forEach((f, i) => {
        if (insights[i]) {
          f.reason = `${f.reason} ${insights[i]}`;
        }
      });

      return { flags: [...topFlags, ...ruleFlags.slice(10)] };
    } catch {
      // AI enrichment failed, return rule-based flags as-is
      return { flags: ruleFlags };
    }
  }

  return { flags: ruleFlags };
}

export async function generateNarrativeReport(
  budgets: BudgetEntry[],
  year: string,
  division: string
): Promise<{ narrative: string; error?: string }> {
  await requireSession();
  const config = await db.getAiConfig();

  if (!config.enabled) {
    return { narrative: '', error: 'AI is not enabled. Go to Settings > AI to configure it.' };
  }

  const filtered = budgets.filter(b => {
    if (b.year.toString() !== year) return false;
    if (division !== 'All' && b.division !== division) return false;
    return true;
  });

  if (filtered.length === 0) {
    return { narrative: '', error: 'No budget entries found for the selected filters.' };
  }

  const totalBudget = filtered.reduce((s, b) => s + b.totalCostBudget, 0);
  const totalActual = filtered.reduce((s, b) => s + (b.totalCostActual ?? 0), 0);
  const capex = filtered.filter(b => b.category === 'CAPEX');
  const opex = filtered.filter(b => b.category === 'OPEX');
  const capexBudget = capex.reduce((s, b) => s + b.totalCostBudget, 0);
  const opexBudget = opex.reduce((s, b) => s + b.totalCostBudget, 0);
  const utilization = totalBudget > 0 ? ((totalActual / totalBudget) * 100).toFixed(1) : '0';

  // Top items by budget
  const topItems = [...filtered]
    .sort((a, b) => b.totalCostBudget - a.totalCostBudget)
    .slice(0, 5)
    .map(b => `- ${b.projectTitle} (${b.category}, ₱${b.totalCostBudget.toLocaleString()}, status: ${b.status})`);

  // Section breakdown
  const bySectionMap: Record<string, number> = {};
  for (const b of filtered) {
    bySectionMap[b.section] = (bySectionMap[b.section] ?? 0) + b.totalCostBudget;
  }
  const sectionLines = Object.entries(bySectionMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([s, v]) => `- ${s}: ₱${v.toLocaleString()}`);

  // Defective / flagged
  const defective = filtered.filter(b => b.status === 'defective').length;
  const turnedOver = filtered.filter(b => b.status === 'turned over to SAMD').length;

  const context = `
Fiscal Year: ${year}
Division filter: ${division}
Total entries: ${filtered.length}
Total allocated budget: ₱${totalBudget.toLocaleString()}
Total actual expenditure: ₱${totalActual.toLocaleString()}
Budget utilization: ${utilization}%
CAPEX budget: ₱${capexBudget.toLocaleString()} (${capex.length} items)
OPEX budget: ₱${opexBudget.toLocaleString()} (${opex.length} items)
Defective items: ${defective}
Items turned over to SAMD: ${turnedOver}

Top 5 items by budget:
${topItems.join('\n')}

Top sections by budget:
${sectionLines.join('\n')}
`.trim();

  const systemPrompt = `You are a financial analyst writing an executive summary for a broadcast/media organization's budget report. Write in a professional but direct tone. Be specific with numbers. Do not include headers or bullet points — write 3–4 flowing paragraphs. Highlight utilization rate, major spending areas, any concerns, and a closing observation. Use Philippine Peso (₱).`;

  try {
    const narrative = await callAi(config, [{ role: 'user', content: context }], systemPrompt);
    return { narrative };
  } catch (err: any) {
    return { narrative: '', error: err.message ?? 'AI generation failed.' };
  }
}
