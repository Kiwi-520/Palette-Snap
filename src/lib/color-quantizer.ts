
function rgbToHex(r: number, g: number, b: number): string {
  const rInt = Math.round(r);
  const gInt = Math.round(g);
  const bInt = Math.round(b);
  return "#" + ((1 << 24) + (rInt << 16) + (gInt << 8) + bInt).toString(16).slice(1).toUpperCase();
}

// Simple implementation of K-Means clustering for color quantization
function kmeans(pixels: number[][], k: number): number[][] {
    if (pixels.length === 0 || k === 0) {
        return [];
    }

    // --- Helper function to calculate distance between two colors ---
    const colorDistance = (c1: number[], c2: number[]) => {
        return Math.sqrt(
            Math.pow(c1[0] - c2[0], 2) +
            Math.pow(c1[1] - c2[1], 2) +
            Math.pow(c1[2] - c2[2], 2)
        );
    };

    // --- 1. Initialize centroids ---
    // For simplicity, we'll pick k random pixels as initial centroids.
    let centroids = pixels.slice(0, k);
    
    // A more robust way to initialize:
    const uniquePixels = Array.from(new Set(pixels.map(p => JSON.stringify(p)))).map(s => JSON.parse(s));
    if (uniquePixels.length < k) {
        // If we have fewer unique pixels than k, just return the unique ones.
        return uniquePixels;
    }
    centroids = uniquePixels.sort(() => 0.5 - Math.random()).slice(0, k);


    let assignments = new Array(pixels.length).fill(0);
    const maxIterations = 20;

    for (let i = 0; i < maxIterations; i++) {
        // --- 2. Assign pixels to the closest centroid ---
        for (let j = 0; j < pixels.length; j++) {
            let minDistance = Infinity;
            let bestCentroid = 0;
            for (let c = 0; c < k; c++) {
                const distance = colorDistance(pixels[j], centroids[c]);
                if (distance < minDistance) {
                    minDistance = distance;
                    bestCentroid = c;
                }
            }
            assignments[j] = bestCentroid;
        }

        // --- 3. Update centroids to be the average of their assigned pixels ---
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
                // If a centroid has no points, re-initialize it to a random pixel
                newCentroids[c] = pixels[Math.floor(Math.random() * pixels.length)];
            }
        }
        
        // --- 4. Check for convergence ---
        let converged = true;
        for (let c = 0; c < k; c++) {
            if (colorDistance(centroids[c], newCentroids[c]) > 0.1) {
                converged = false;
                break;
            }
        }

        centroids = newCentroids;
        if (converged) {
            break;
        }
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

        const MAX_WIDTH = 100; // Reduced size for faster processing
        const MAX_HEIGHT = 100;
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
        
        const pixelArray: number[][] = [];
        for (let i = 0; i < pixelData.length; i += 4) {
          if (pixelData[i+3] < 125) continue;
          
          const r = pixelData[i];
          const g = pixelData[i+1];
          const b = pixelData[i+2];
          
          pixelArray.push([r, g, b]);
        }
        
        if (pixelArray.length === 0) {
          return reject(new Error("No significant colors found in the image."));
        }

        // Use the K-Means implementation
        const centroids = kmeans(pixelArray, colorCount);
        
        const palette = centroids.map(rgb => rgbToHex(rgb[0], rgb[1], rgb[2]));
        
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
