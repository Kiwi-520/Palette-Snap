'use server';
/**
 * @fileOverview An AI flow for generating color palettes.
 *
 * - suggestComplementaryPalette - Generates a palette that complements a given set of colors.
 * - SuggestComplementaryPaletteInput - The input type for the suggestComplementaryPalette function.
 * - SuggestComplementaryPaletteOutput - The return type for the suggestComplementaryPalette function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestComplementaryPaletteInputSchema = z.object({
  baseColors: z.array(z.string()).describe('An array of hex color codes that the user has selected.'),
});
export type SuggestComplementaryPaletteInput = z.infer<typeof SuggestComplementaryPaletteInputSchema>;

const SuggestComplementaryPaletteOutputSchema = z.object({
  palette: z.array(z.string().regex(/^#[0-9a-fA-F]{6}$/)).describe('An array of 5 hex color codes that complement the base colors.'),
});
export type SuggestComplementaryPaletteOutput = z.infer<typeof SuggestComplementaryPaletteOutputSchema>;


export async function suggestComplementaryPalette(input: SuggestComplementaryPaletteInput): Promise<SuggestComplementaryPaletteOutput> {
  return suggestComplementaryPaletteFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestComplementaryPalettePrompt',
  input: {schema: SuggestComplementaryPaletteInputSchema},
  output: {schema: SuggestComplementaryPaletteOutputSchema},
  prompt: `You are an expert in color theory. The user has provided a list of base colors. 
  
Generate a palette of 5 new colors that complement these base colors. The new colors should be harmonious and aesthetically pleasing when paired with the base colors.

Base Colors:
{{#each baseColors}}
- {{{this}}}
{{/each}}

Provide your response as a JSON object with a 'palette' field containing an array of 5 hex color strings.`,
});

const suggestComplementaryPaletteFlow = ai.defineFlow(
  {
    name: 'suggestComplementaryPaletteFlow',
    inputSchema: SuggestComplementaryPaletteInputSchema,
    outputSchema: SuggestComplementaryPaletteOutputSchema,
  },
  async (input) => {
    const {output} = await prompt(input);
    return output!;
  }
);
