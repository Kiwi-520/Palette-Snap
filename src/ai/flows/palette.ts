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
      prompt: `You are a color analysis tool. Your task is to extract the 6 most dominant colors from the provided image.
      
Process:
1.  Analyze the pixels of the image.
2.  Apply a k-means clustering algorithm (k=6) to group the pixel colors into clusters.
3.  Determine the centroid of each cluster.
4.  Convert the centroid colors to hex code format.
5.  Return an array of these 6 hex color codes.`,
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
