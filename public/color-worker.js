// K-Means clustering implementation for color quantization
// This runs in a Web Worker to avoid blocking the main thread.

// Calculate the distance between two colors
function colorDistance(c1, c2) {
    const dR = c1.r - c2.r;
    const dG = c1.g - c2.g;
    const dB = c1.b - c2.b;
    return Math.sqrt(dR * dR + dG * dG + dB * dB);
}

// Get a random centroid from the pixels
function getRandomCentroid(pixels) {
    return pixels[Math.floor(Math.random() * pixels.length)];
}

// The main K-Means function
function kmeans(pixels, k) {
    // Initialize centroids randomly
    let centroids = [];
    for (let i = 0; i < k; i++) {
        centroids.push(getRandomCentroid(pixels));
    }

    const maxIterations = 20;
    for (let iter = 0; iter < maxIterations; iter++) {
        // Create clusters
        const clusters = Array.from({ length: k }, () => []);

        // Assign each pixel to the closest centroid
        for (const pixel of pixels) {
            let minDistance = Infinity;
            let closestCentroidIndex = -1;
            for (let i = 0; i < k; i++) {
                const distance = colorDistance(pixel, centroids[i]);
                if (distance < minDistance) {
                    minDistance = distance;
                    closestCentroidIndex = i;
                }
            }
            clusters[closestCentroidIndex].push(pixel);
        }

        // Update centroids to be the average of their cluster
        let hasConverged = true;
        for (let i = 0; i < k; i++) {
            const cluster = clusters[i];
            if (cluster.length === 0) {
                 // If a cluster is empty, re-initialize its centroid
                centroids[i] = getRandomCentroid(pixels);
                hasConverged = false;
                continue;
            };

            const sum = cluster.reduce((acc, pixel) => ({
                r: acc.r + pixel.r,
                g: acc.g + pixel.g,
                b: acc.b + pixel.b
            }), { r: 0, g: 0, b: 0 });

            const newCentroid = {
                r: Math.round(sum.r / cluster.length),
                g: Math.round(sum.g / cluster.length),
                b: Math.round(sum.b / cluster.length)
            };

            if (colorDistance(centroids[i], newCentroid) > 0.1) {
                hasConverged = false;
            }
            centroids[i] = newCentroid;
        }

        if (hasConverged) break;
    }

    return centroids;
}

// Convert RGB to HEX
function rgbToHex(r, g, b) {
    return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase();
}


self.onmessage = function(event) {
    const { imageBitmap } = event.data;

    // Downsample the image for performance
    const maxDimension = 100;
    let width, height;
    if (imageBitmap.width > imageBitmap.height) {
        width = maxDimension;
        height = Math.round(maxDimension * imageBitmap.height / imageBitmap.width);
    } else {
        height = maxDimension;
        width = Math.round(maxDimension * imageBitmap.width / imageBitmap.height);
    }

    const canvas = new OffscreenCanvas(width, height);
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    
    if (!ctx) {
        self.postMessage({ error: "Could not create OffscreenCanvas context." });
        return;
    }

    ctx.drawImage(imageBitmap, 0, 0, width, height);
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;

    // Extract pixels into an array of {r, g, b} objects
    const pixels = [];
    for (let i = 0; i < data.length; i += 4) {
        // Ignore transparent or near-white pixels to get more meaningful colors
        if (data[i + 3] < 200 || (data[i] > 250 && data[i+1] > 250 && data[i+2] > 250)) continue;

        pixels.push({ r: data[i], g: data[i + 1], b: data[i + 2] });
    }

    if (pixels.length === 0) {
        self.postMessage({ error: "Could not extract any pixels from the image." });
        return;
    }

    // Run K-Means to get the palette
    const k = 10;
    const palette = kmeans(pixels, k);

    // Convert to histogram format
    const histogram = palette.map(color => ({
        hex: rgbToHex(color.r, color.g, color.b),
        count: 1 // Count is no longer relevant, but we keep the structure
    }));

    self.postMessage({ histogram });
};
