export type BlindnessMode = 'protanopia' | 'deuteranopia' | 'tritanopia' | 'achromatopsia' | 'none';

const matrices: Record<Exclude<BlindnessMode, 'none'>, number[]> = {
    protanopia: [
        0.567, 0.433, 0,
        0.558, 0.442, 0,
        0, 0.242, 0.758
    ],
    deuteranopia: [
        0.625, 0.375, 0,
        0.7, 0.3, 0,
        0, 0.3, 0.7
    ],
    tritanopia: [
        0.95, 0.05, 0,
        0, 0.433, 0.567,
        0, 0.475, 0.525
    ],
    achromatopsia: [
        0.299, 0.587, 0.114,
        0.299, 0.587, 0.114,
        0.299, 0.587, 0.114
    ]
};

export function applyColorBlindness(imageData: ImageData, mode: BlindnessMode): ImageData {
    if (mode === 'none' || !matrices[mode]) {
        return imageData;
    }

    const data = imageData.data;
    const matrix = matrices[mode];

    for (let i = 0; i < data.length; i += 4) {
        const r = data[i] / 255;
        const g = data[i + 1] / 255;
        const b = data[i + 2] / 255;

        // Apply matrix transformation
        const r_prime = r * matrix[0] + g * matrix[1] + b * matrix[2];
        const g_prime = r * matrix[3] + g * matrix[4] + b * matrix[5];
        const b_prime = r * matrix[6] + g * matrix[7] + b * matrix[8];

        // Clamp and denormalize
        data[i] = Math.round(Math.max(0, Math.min(1, r_prime)) * 255);
        data[i + 1] = Math.round(Math.max(0, Math.min(1, g_prime)) * 255);
        data[i + 2] = Math.round(Math.max(0, Math.min(1, b_prime)) * 255);
    }

    return imageData;
}
