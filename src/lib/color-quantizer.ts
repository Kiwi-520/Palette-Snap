
export type ColorHistogram = {
  hex: string;
  count: number;
}[];

export function generatePaletteFromImage(imageUrl: string): Promise<ColorHistogram> {
  return new Promise((resolve, reject) => {
    // Check if we are in a browser environment
    if (typeof window === 'undefined' || !window.Worker) {
      return reject(new Error('Web Workers are not supported in this environment.'));
    }

    const worker = new Worker('/color-worker.js');

    worker.onmessage = (event) => {
      const { histogram, error } = event.data;
      if (error) {
        console.error("Error from color worker:", error);
        reject(new Error(error));
      } else {
        resolve(histogram);
      }
      worker.terminate();
    };

    worker.onerror = (error) => {
      console.error("An error occurred in the color worker:", error);
      reject(new Error("An unexpected error occurred in the color analysis worker."));
      worker.terminate();
    };

    // We need to fetch the image data as a blob to send it to the worker
    fetch(imageUrl)
      .then(response => response.blob())
      .then(blob => createImageBitmap(blob))
      .then(imageBitmap => {
        // Transfer the ImageBitmap to the worker to avoid copying data
        worker.postMessage({ imageBitmap }, [imageBitmap]);
      })
      .catch(err => {
        console.error("Failed to fetch or process image for worker:", err);
        reject(new Error("Could not load the image for analysis."));
        worker.terminate();
      });
  });
}
