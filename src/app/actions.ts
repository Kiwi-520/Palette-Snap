'use server';

import { z } from 'zod';

const inputSchema = z.object({
  imageUrl: z.string(),
});

export async function generatePaletteAction(input: z.infer<typeof inputSchema>) {
  // This is a stub.
  return [];
}
