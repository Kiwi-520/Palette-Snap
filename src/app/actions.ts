'use server';

import { paletteFlow } from '@/ai/flows/palette';
import { z } from 'zod';

const inputSchema = z.object({
  imageUrl: z.string(),
});

export async function generatePaletteAction(input: z.infer<typeof inputSchema>) {
  const validatedInput = inputSchema.safeParse(input);

  if (!validatedInput.success) {
    throw new Error('Invalid input');
  }

  const { palette } = await paletteFlow(validatedInput.data);
  return palette;
}
