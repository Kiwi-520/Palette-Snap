import quantize from 'quantize';

function rgbToHex(r: number, g: number, b: number): string {
  return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase();
}

export function generatePaletteFromImage(imageUrl: string, colorCount: number = 6): Promise<string[]> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        return reject(new Error('Could not get canvas context'));
      }

      // Resize image for faster processing
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
      
      const pixelArray: [number, number, number][] = [];
      for (let i = 0; i < pixelData.length; i += 4) {
        // Ignore transparent pixels and pure white/black for better results
        if (pixelData[i+3] < 125) continue;
        if (pixelData[i] > 250 && pixelData[i+1] > 250 && pixelData[i+2] > 250) continue;
        if (pixelData[i] < 5 && pixelData[i+1] < 5 && pixelData[i+2] < 5) continue;
        pixelArray.push([pixelData[i], pixelData[i+1], pixelData[i+2]]);
      }
      
      if (pixelArray.length === 0) {
        return reject(new Error("No pixels to analyze. The image might be transparent or only contain black/white."));
      }

      const allSame = pixelArray.every(p => p[0] === pixelArray[0][0] && p[1] === pixelArray[0][1] && p[2] === pixelArray[0][2]);

      if (allSame) {
        const singleColor = pixelArray[0];
        return resolve([rgbToHex(singleColor[0], singleColor[1], singleColor[2])]);
      }
      
      const colorMap = quantize(pixelArray, colorCount);
      const palette = colorMap.palette().map((rgb: [number, number, number]) => rgbToHex(rgb[0], rgb[1], rgb[2]));
      
      resolve(palette);
    };
    img.onerror = (err) => {
      reject(err);
    };
    img.src = imageUrl;
  });
}
