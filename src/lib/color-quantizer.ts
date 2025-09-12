import quantize from 'quantize';

function rgbToHex(r: number, g: number, b: number): string {
  // Ensure values are integers
  const rInt = Math.round(r);
  const gInt = Math.round(g);
  const bInt = Math.round(b);
  return "#" + ((1 << 24) + (rInt << 16) + (gInt << 8) + bInt).toString(16).slice(1).toUpperCase();
}

export function generatePaletteFromImage(imageUrl: string, colorCount: number = 6): Promise<string[]> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    // This is crucial for loading images from other origins (like picsum.photos)
    img.crossOrigin = 'Anonymous';
    
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          return reject(new Error('Could not get canvas context. Your browser may not support it.'));
        }

        // --- Image Resizing for Performance ---
        const MAX_WIDTH = 200;
        const MAX_HEIGHT = 200;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }
        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(img, 0, 0, width, height);

        const imageData = ctx.getImageData(0, 0, width, height);
        const pixelData = imageData.data;
        
        // --- Pixel Filtering ---
        const pixelArray: [number, number, number][] = [];
        for (let i = 0; i < pixelData.length; i += 4) {
          // Ignore transparent or semi-transparent pixels
          if (pixelData[i+3] < 125) continue;
          
          const r = pixelData[i];
          const g = pixelData[i+1];
          const b = pixelData[i+2];

          // Ignore pure white and pure black for more interesting palettes
          if (r > 250 && g > 250 && b > 250) continue;
          if (r < 5 && g < 5 && b < 5) continue;
          
          pixelArray.push([r, g, b]);
        }
        
        // --- Robustness Checks ---

        // 1. Check if there are any pixels left to process
        if (pixelArray.length === 0) {
          return reject(new Error("No significant colors found. The image might be mostly transparent, white, or black."));
        }

        // 2. The `quantize` library requires at least 2 colors to work.
        // It's safer to ensure we have at least as many pixels as colors we want.
        if (pixelArray.length < colorCount) {
             // If we have very few pixels, we can just use them as the palette
             const uniqueColors = Array.from(new Set(pixelArray.map(p => JSON.stringify(p)))).map(s => JSON.parse(s));
             const palette = uniqueColors.slice(0, colorCount).map(rgb => rgbToHex(rgb[0], rgb[1], rgb[2]));
             return resolve(palette);
        }

        // --- Color Quantization ---
        const colorMap = quantize(pixelArray, colorCount);
        if (!colorMap) {
            return reject(new Error("Color quantization failed. The library could not produce a palette."));
        }
        
        const rawPalette = colorMap.palette();
        if (!rawPalette || rawPalette.length === 0) {
            return reject(new Error("Generated palette is empty."));
        }

        const palette = rawPalette.map((rgb: [number, number, number]) => rgbToHex(rgb[0], rgb[1], rgb[2]));
        
        resolve(palette);
      } catch (error) {
          console.error("Error during palette generation:", error);
          reject(new Error("An unexpected error occurred while processing the image."));
      }
    };

    img.onerror = (err) => {
      console.error("Image failed to load:", err);
      reject(new Error("Could not load the image. It might be an invalid file, a network issue, or a cross-origin problem."));
    };

    img.src = imageUrl;
  });
}
