'use server';
/**
 * @fileOverview An AI assistant flow that suggests comprehensive and clear Action Plan and Description text for budget items.
 *
 * - aiBudgetDescriptionAssistant - A function that handles the generation of suggested action plan and description.
 * - AiBudgetDescriptionAssistantInput - The input type for the aiBudgetDescriptionAssistant function.
 * - AiBudgetDescriptionAssistantOutput - The return type for the aiBudgetDescriptionAssistant function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AiBudgetDescriptionAssistantInputSchema = z.object({
  category: z.string().describe('The main budget category (e.g., CAPEX, OPEX).'),
  subcategory:
    z.string().describe('The specific subcategory within the main budget category (e.g., Manpower, Storage systems).'),
});
export type AiBudgetDescriptionAssistantInput = z.infer<
  typeof AiBudgetDescriptionAssistantInputSchema
>;

const AiBudgetDescriptionAssistantOutputSchema = z.object({
  suggestedActionPlan: z.string().describe('A suggested, comprehensive, and clear action plan for the budget item.'),
  suggestedDescription:
    z.string().describe('A suggested, comprehensive, and clear description for the budget item.'),
});
export type AiBudgetDescriptionAssistantOutput = z.infer<
  typeof AiBudgetDescriptionAssistantOutputSchema
>;

const budgetDescriptionPrompt = ai.definePrompt({
  name: 'budgetDescriptionPrompt',
  input: {schema: AiBudgetDescriptionAssistantInputSchema},
  output: {schema: AiBudgetDescriptionAssistantOutputSchema},
  prompt: `You are an AI assistant specialized in budget management. Your task is to generate a comprehensive and clear action plan and description for a budget item based on its category and subcategory.

Consider the typical activities and details associated with the provided category and subcategory to generate realistic and helpful suggestions. Keep the suggestions concise but informative.

Category: {{{category}}}
Subcategory: {{{subcategory}}}`,
});

const aiBudgetDescriptionAssistantFlow = ai.defineFlow(
  {
    name: 'aiBudgetDescriptionAssistantFlow',
    inputSchema: AiBudgetDescriptionAssistantInputSchema,
    outputSchema: AiBudgetDescriptionAssistantOutputSchema,
  },
  async input => {
    const {output} = await budgetDescriptionPrompt(input);
    return output!;
  }
);

export async function aiBudgetDescriptionAssistant(
  input: AiBudgetDescriptionAssistantInput
): Promise<AiBudgetDescriptionAssistantOutput> {
  return aiBudgetDescriptionAssistantFlow(input);
}
