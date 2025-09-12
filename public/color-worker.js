
// Helper function to convert RGB to Hex
function rgbToHex(r, g, b) {
  const rInt = Math.round(r);
  const gInt = Math.round(g);
  const bInt = Math.round(b);
  return "#" + ((1 << 24) + (rInt << 16) + (gInt << 8) + bInt).toString(16).slice(1).toUpperCase();
}

self.onmessage = (event) => {
  const { imageBitmap } = event.data;

  try {
    const MAX_DIMENSION = 200;
    let width = imageBitmap.width;
    let height = imageBitmap.height;

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
    
    // OffscreenCanvas is designed for workers
    const canvas = new OffscreenCanvas(width, height);
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      self.postMessage({ error: 'Could not get canvas context in worker.' });
      return;
    }
    
    ctx.drawImage(imageBitmap, 0, 0, width, height);
    imageBitmap.close(); // Free up memory

    const imageData = ctx.getImageData(0, 0, width, height);
    const pixelData = imageData.data;
    
    const colorFrequency = {};

    for (let i = 0; i < pixelData.length; i += 4) {
      // Ignore transparent pixels
      if (pixelData[i+3] < 128) continue;
      
      const hex = rgbToHex(pixelData[i], pixelData[i+1], pixelData[i+2]);
      colorFrequency[hex] = (colorFrequency[hex] || 0) + 1;
    }

    const histogram = Object.entries(colorFrequency)
      .map(([hex, count]) => ({ hex, count }))
      .sort((a, b) => b.count - a.count);
    
    self.postMessage({ histogram });

  } catch (error) {
    console.error("Error in color worker:", error);
    self.postMessage({ error: "An unexpected error occurred while processing the image." });
  } finally {
    self.close(); // Terminate the worker
  }
};
