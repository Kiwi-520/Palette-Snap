import { z } from 'zod';
import { ai } from '../genkit';

const outputSchema = z.object({
  palette: z.array(z.string().describe('Array of hex color codes')),
});

export const paletteFlow = ai.defineFlow(
  {
    name: 'paletteFlow',
    inputSchema: z.object({
      imageUrl: z.string().describe('Image data URL'),
    }),
    outputSchema,
  },
  async ({ imageUrl }) => {
    const llmResponse = await ai.generate({
      prompt: `Extract a color palette of 6 dominant colors from the provided image. Analyze the image and use color clustering to determine the most representative colors. Return the colors as an array of hex codes.`,
      tools: [],
      config: {
        temperature: 0.1,
      },
      input: {
        image: { url: imageUrl },
      },
      output: {
        format: 'json',
        schema: z.object({
          palette: z.array(z.string().regex(/^#[0-9a-fA-F]{6}$/)).length(6),
        }),
      },
    });

    const structuredResponse = llmResponse.output();
    if (!structuredResponse?.palette || structuredResponse.palette.length !== 6) {
      // Fallback in case of empty or invalid response
      return {
        palette: ['#E6E6FA', '#D8BFD8', '#A341F4', '#4190F4', '#483D8B', '#191970'],
      };
    }
    return structuredResponse;
  }
);
