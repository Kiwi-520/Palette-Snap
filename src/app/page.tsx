"use client";

import { useState, useRef, useCallback, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { ImageHandler } from '@/components/palette-snap/image-handler';
import { PaletteControls } from '@/components/palette-snap/palette-controls';
import { ColorDisplay } from '@/components/palette-snap/color-display';
import { generatePaletteFromImage, type ColorHistogram } from '@/lib/color-quantizer';
import { Button } from '@/components/ui/button';
import { Camera, Upload } from 'lucide-react';
import { CameraCapture } from '@/components/palette-snap/camera-capture';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

export type Palette = string[];

export default function Home() {
  const [image, setImage] = useState<string | null>(null);
  const [histogram, setHistogram] = useState<ColorHistogram | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [pickerState, setPickerState] = useState<{ x: number; y: number; color: string; } | null>(null);
  const [palette, setPalette] = useState<Palette>([]);
  const { toast } = useToast();

  const imageRef = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const processImage = async (dataUrl: string) => {
    setImage(dataUrl);
    setHistogram(null);
    setPalette([]);
    setPickerState(null);
    setIsLoading(true);
    try {
      const newHistogram = await generatePaletteFromImage(dataUrl);
      setHistogram(newHistogram);
      // Automatically generate a default 8-color palette
      if (newHistogram.length > 0) {
        const defaultPalette = newHistogram.slice(0, 8).map(c => c.hex);
        setPalette(defaultPalette);
      }
    } catch (error) {
      console.error("Failed to generate palette:", error);
      const errorMessage = error instanceof Error ? error.message : "Could not generate a color palette from the image.";
      toast({
        variant: "destructive",
        title: "Palette Generation Failed",
        description: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        const dataUrl = reader.result as string;
        processImage(dataUrl);
      };
      reader.readAsDataURL(file);
    }
  };
  
  const handleCapture = (imageData: string) => {
    processImage(imageData);
    setIsCameraOpen(false);
  };

  // Setup canvas for color picking
  useEffect(() => {
    if (image && imageRef.current) {
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d', { willReadFrequently: true });
      const img = imageRef.current;

      const updateCanvas = () => {
        if (context && img.complete && img.naturalWidth > 0) {
          canvas.width = img.clientWidth;
          canvas.height = img.clientHeight;
          context.drawImage(img, 0, 0, img.clientWidth, img.clientHeight);
          canvasRef.current = canvas;
        }
      };

      if (img.complete) {
        updateCanvas();
      } else {
        img.onload = updateCanvas;
      }
    }
  }, [image]);

  const updateLoupe = useCallback((x: number, y: number) => {
    if (!canvasRef.current) return;
  
    const context = canvasRef.current.getContext('2d');
    if (context) {
      const clampedX = Math.max(0, Math.min(x, canvasRef.current.width - 1));
      const clampedY = Math.max(0, Math.min(y, canvasRef.current.height - 1));
      
      const pixel = context.getImageData(clampedX, clampedY, 1, 1).data;
      const color = `#${('000000' + ((pixel[0] << 16) | (pixel[1] << 8) | pixel[2]).toString(16)).slice(-6).toUpperCase()}`;
      setPickerState({ x: clampedX, y: clampedY, color });
    }
  }, []);

  return (
    <div className="w-full bg-background font-sans text-foreground p-4 lg:p-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 w-full max-w-7xl mx-auto">
        <div className="lg:col-span-2 flex flex-col gap-8">
          <ImageHandler 
            image={image} 
            imageRef={imageRef} 
            pickerState={pickerState}
            setPickerState={setPickerState}
            updateLoupe={updateLoupe}
          />
          <PaletteControls 
            palette={palette} 
            setPalette={setPalette} 
            histogram={histogram}
            isLoading={isLoading}
          />
        </div>
        <div className="lg:col-span-1 flex flex-col gap-8">
            <ColorDisplay pickerState={pickerState} />
            <div className='bg-card border rounded-lg p-6 flex flex-col items-center justify-center text-center gap-4'>
                <Button asChild size="lg">
                    <label htmlFor="image-upload" className="cursor-pointer flex items-center gap-2">
                        <Upload className="h-5 w-5" />
                        Use your Image
                    </label>
                </Button>
                 <Dialog open={isCameraOpen} onOpenChange={setIsCameraOpen}>
                    <DialogTrigger asChild>
                        <Button size="lg" variant="outline">
                        <Camera className="mr-2 h-5 w-5" />
                        Use Camera
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-3xl p-4">
                        <DialogHeader>
                        <DialogTitle>Capture from Camera</DialogTitle>
                        </DialogHeader>
                        <CameraCapture onCapture={handleCapture} />
                    </DialogContent>
                </Dialog>
                 <input
                    id="image-upload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageUpload}
                />
                <p className='text-sm text-muted-foreground mt-2'>
                    We think data protection is important! <br />
                    <span className="text-accent font-medium">No data is sent.</span> The magic happens in your browser.
                </p>
            </div>
        </div>
      </div>
    </div>
  );
}
