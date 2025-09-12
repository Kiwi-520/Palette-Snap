
function rgbToHex(r: number, g: number, b: number): string {
  const rInt = Math.round(r);
  const gInt = Math.round(g);
  const bInt = Math.round(b);
  return "#" + ((1 << 24) + (rInt << 16) + (gInt << 8) + bInt).toString(16).slice(1).toUpperCase();
}

export type ColorHistogram = {
  hex: string;
  count: number;
}[];


export function generatePaletteFromImage(imageUrl: string): Promise<ColorHistogram> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          return reject(new Error('Could not get canvas context.'));
        }

        const MAX_DIMENSION = 200;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_DIMENSION) {
            height *= MAX_DIMENSION / width;
            width = MAX_DIMENSION;
          }
        } else {
          if (height > MAX_DIMENSION) {
            width *= MAX_DIMENSION / height;
            height = MAX_DIMENSION;
          }
        }
        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(img, 0, 0, width, height);

        const imageData = ctx.getImageData(0, 0, width, height);
        const pixelData = imageData.data;
        
        const colorFrequency: { [key: string]: number } = {};

        for (let i = 0; i < pixelData.length; i += 4) {
          if (pixelData[i+3] < 128) continue;
          
          const hex = rgbToHex(pixelData[i], pixelData[i+1], pixelData[i+2]);
          colorFrequency[hex] = (colorFrequency[hex] || 0) + 1;
        }

        const histogram: ColorHistogram = Object.entries(colorFrequency)
          .map(([hex, count]) => ({ hex, count }))
          .sort((a, b) => b.count - a.count);
        
        if (histogram.length === 0) {
          return resolve([]);
        }
        
        resolve(histogram);
      } catch (error) {
          console.error("Error during palette generation:", error);
          reject(new Error("An unexpected error occurred while processing the image."));
      }
    };

    img.onerror = (err) => {
      console.error("Image failed to load:", err);
      reject(new Error("Could not load the image."));
    };

    img.src = imageUrl;
  });
}
