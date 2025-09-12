
function rgbToHex(r: number, g: number, b: number): string {
  const rInt = Math.round(r);
  const gInt = Math.round(g);
  const bInt = Math.round(b);
  return "#" + ((1 << 24) + (rInt << 16) + (gInt << 8) + bInt).toString(16).slice(1).toUpperCase();
}

// K-Means clustering implementation for color quantization
function kmeans(pixels: number[][], k: number): number[][] {
    if (pixels.length === 0 || k === 0) {
        return [];
    }

    const uniquePixels = Array.from(new Set(pixels.map(p => JSON.stringify(p)))).map(s => JSON.parse(s) as number[]);
    if (uniquePixels.length < k) {
        k = uniquePixels.length;
    }
    if (k === 0) return [];


    // --- Helper function to calculate squared distance between two colors ---
    const colorDistanceSquared = (c1: number[], c2: number[]) => {
        return (c1[0] - c2[0]) ** 2 + (c1[1] - c2[1]) ** 2 + (c1[2] - c2[2]) ** 2;
    };

    // --- 1. Initialize centroids using k-means++ ---
    let centroids: number[][] = [];
    centroids.push(uniquePixels[Math.floor(Math.random() * uniquePixels.length)]);

    while (centroids.length < k) {
        let distances: number[] = uniquePixels.map(pixel => {
            let minDistance = Infinity;
            for (const centroid of centroids) {
                const dist = colorDistanceSquared(pixel, centroid);
                if (dist < minDistance) {
                    minDistance = dist;
                }
            }
            return minDistance;
        });

        let sumDistances = distances.reduce((a, b) => a + b, 0);
        let randomValue = Math.random() * sumDistances;
        
        let nextCentroid: number[] | null = null;
        for (let i = 0; i < uniquePixels.length; i++) {
            randomValue -= distances[i];
            if (randomValue <= 0) {
                nextCentroid = uniquePixels[i];
                break;
            }
        }
        centroids.push(nextCentroid || uniquePixels[uniquePixels.length - 1]);
    }

    let assignments = new Array(pixels.length).fill(0);
    const maxIterations = 20;

    for (let i = 0; i < maxIterations; i++) {
        // --- 2. Assign pixels to the closest centroid ---
        let changed = false;
        for (let j = 0; j < pixels.length; j++) {
            let minDistance = Infinity;
            let bestCentroid = 0;
            for (let c = 0; c < k; c++) {
                const distance = colorDistanceSquared(pixels[j], centroids[c]);
                if (distance < minDistance) {
                    minDistance = distance;
                    bestCentroid = c;
                }
            }
            if (assignments[j] !== bestCentroid) {
                assignments[j] = bestCentroid;
                changed = true;
            }
        }

        if (!changed) break; // Convergence

        // --- 3. Update centroids ---
        const newCentroids: number[][] = new Array(k).fill(0).map(() => [0, 0, 0]);
        const counts = new Array(k).fill(0);

        for (let j = 0; j < pixels.length; j++) {
            const centroidIndex = assignments[j];
            newCentroids[centroidIndex][0] += pixels[j][0];
            newCentroids[centroidIndex][1] += pixels[j][1];
            newCentroids[centroidIndex][2] += pixels[j][2];
            counts[centroidIndex]++;
        }

        for (let c = 0; c < k; c++) {
            if (counts[c] > 0) {
                newCentroids[c][0] /= counts[c];
                newCentroids[c][1] /= counts[c];
                newCentroids[c][2] /= counts[c];
            } else {
                // If a centroid becomes empty, reinitialize it to the pixel furthest from other centroids.
                let maxDist = -1;
                let farthestPixel: number[] | null = null;
                for (const pixel of uniquePixels) {
                    let minDistToCentroid = Infinity;
                    for (const centroid of newCentroids.filter((_, idx) => idx !== c)) {
                       minDistToCentroid = Math.min(minDistToCentroid, colorDistanceSquared(pixel, centroid));
                    }
                    if (minDistToCentroid > maxDist) {
                        maxDist = minDistToCentroid;
                        farthestPixel = pixel;
                    }
                }
                newCentroids[c] = farthestPixel || uniquePixels[Math.floor(Math.random() * uniquePixels.length)];
            }
        }
        centroids = newCentroids;
    }

    return centroids;
}


export function generatePaletteFromImage(imageUrl: string, colorCount: number = 6): Promise<string[]> {
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

        const MAX_DIMENSION = 100;
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
        
        const pixelArray: number[][] = [];
        for (let i = 0; i < pixelData.length; i += 4) {
          // Skip transparent pixels
          if (pixelData[i+3] < 128) continue;
          
          pixelArray.push([pixelData[i], pixelData[i+1], pixelData[i+2]]);
        }
        
        if (pixelArray.length === 0) {
          return resolve([]);
        }
        
        const centroids = kmeans(pixelArray, colorCount);
        
        let palette = centroids.map(rgb => rgbToHex(rgb[0], rgb[1], rgb[2]));

        // Ensure palette has the requested number of colors if possible
        if (palette.length < colorCount) {
           const uniqueColors = Array.from(new Set(pixelArray.map(p => rgbToHex(p[0], p[1], p[2]))));
           const additionalColors = uniqueColors.filter(c => !palette.includes(c));
           palette = [...palette, ...additionalColors.slice(0, colorCount - palette.length)];
        }
        
        resolve(palette);
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
