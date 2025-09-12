'use server';

import { suggestComplementaryPalette, type SuggestComplementaryPaletteInput } from '@/ai/flows/palette';

export async function getComplementaryPalette(baseColors: string[]) {
    try {
        const result = await suggestComplementaryPalette({ baseColors });
        return { success: true, palette: result.palette };
    } catch (error) {
        console.error('Error generating complementary palette:', error);
        return { success: false, error: 'Could not generate complementary palette.' };
    }
}
