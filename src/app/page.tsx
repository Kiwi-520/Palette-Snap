"use client";

import { useState, useRef, useCallback, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { ImageHandler } from '@/components/palette-snap/image-handler';
import { PaletteControls } from '@/components/palette-snap/palette-controls';
import { ColorDetails } from '@/components/palette-snap/color-details';
import { generatePaletteFromImage, type ColorHistogram } from '@/lib/color-quantizer';
import { Button } from '@/components/ui/button';
import { Camera, Upload, Library } from 'lucide-react';
import { CameraCapture } from '@/components/palette-snap/camera-capture';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from '@/components/ui/dialog';
import { Card } from '@/components/ui/card';
import { SavedPalettes } from '@/components/palette-snap/saved-palettes';
import type { BlindnessMode } from '@/lib/color-blindness';
import { useLocalStorage } from '@/lib/hooks/use-local-storage';

export type Palette = string[];
export type SavedPalette = {
  id: string;
  name: string;
  colors: Palette;
};

export default function Home() {
  const [image, setImage] = useState<string | null>(null);
  const [filteredImage, setFilteredImage] = useState<string | null>(null);
  const [blindnessMode, setBlindnessMode] = useState<BlindnessMode>('none');
  const [histogram, setHistogram] = useState<ColorHistogram | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [pickerState, setPickerState] = useState<{ x: number; y: number; color: string; } | null>(null);
  const [palette, setPalette] = useState<Palette>([]);
  const [savedPalettes, setSavedPalettes] = useLocalStorage<SavedPalette[]>('palettes', []);

  const { toast } = useToast();

  const imageRef = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const processImage = useCallback(async (dataUrl: string) => {
    setImage(dataUrl);
    setFilteredImage(dataUrl); // Start with the original image
    setHistogram(null);
    setPalette([]);
    setPickerState(null);
    setIsLoading(true);
    try {
      const newHistogram = await generatePaletteFromImage(dataUrl);
      setHistogram(newHistogram);
      if (newHistogram.length > 0) {
        const defaultPalette = newHistogram.slice(0, Math.min(10, newHistogram.length)).map(c => c.hex);
        setPalette(defaultPalette);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Could not generate palette.";
      toast({
        variant: "destructive",
        title: "Palette Generation Failed",
        description: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        processImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };
  
  const handleCapture = (imageData: string) => {
    processImage(imageData);
    setIsCameraOpen(false);
  };

  const handleSavePalette = () => {
    if (palette.length === 0) return;
    const name = prompt("Enter a name for your palette:");
    if (name) {
      const newPalette: SavedPalette = {
        id: new Date().toISOString(),
        name,
        colors: palette,
      };
      setSavedPalettes([...savedPalettes, newPalette]);
      toast({
        title: "Palette Saved!",
        description: `"${name}" has been added to your library.`,
      });
    }
  };

  useEffect(() => {
    // This effect creates a canvas copy of the displayed image for the color picker
    // It runs whenever the filtered image changes
    if (filteredImage && imageRef.current) {
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d', { willReadFrequently: true });
      const img = imageRef.current;

      const updateCanvas = () => {
        if (context && img.complete && img.naturalWidth > 0) {
          // Match canvas dimensions to the displayed image dimensions
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
  }, [filteredImage]);

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
            filteredImage={filteredImage}
            setFilteredImage={setFilteredImage}
            imageRef={imageRef} 
            pickerState={pickerState}
            setPickerState={setPickerState}
            updateLoupe={updateLoupe}
            blindnessMode={blindnessMode}
            setBlindnessMode={setBlindnessMode}
          />
          <PaletteControls 
            palette={palette} 
            setPalette={setPalette} 
            histogram={histogram}
            isLoading={isLoading}
            onSave={handleSavePalette}
          />
        </div>
        <div className="lg:col-span-1 flex flex-col gap-8">
            <ColorDetails pickerState={pickerState} />
            <Card className='bg-card border rounded-lg p-6 flex flex-col items-center justify-center text-center gap-4'>
                <p className="font-belleza text-lg text-foreground">Get Started</p>
                <div className="flex flex-col sm:flex-row gap-4 w-full justify-center">
                    <Button asChild size="lg" className="flex-1">
                        <label htmlFor="image-upload" className="cursor-pointer flex items-center justify-center">
                            <Upload className="mr-2 h-5 w-5" />
                            Upload
                        </label>
                    </Button>
                    <Dialog open={isCameraOpen} onOpenChange={setIsCameraOpen}>
                        <DialogTrigger asChild>
                            <Button size="lg" variant="outline" className="flex-1">
                                <Camera className="mr-2 h-5 w-5" />
                                Camera
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-3xl p-4 sm:p-6">
                            <DialogHeader>
                                <DialogTitle>Capture from Camera</DialogTitle>
                            </DialogHeader>
                            <CameraCapture onCapture={handleCapture} />
                        </DialogContent>
                    </Dialog>
                </div>
                 <input id="image-upload" type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                <p className='text-sm text-muted-foreground mt-2 font-alegreya'>
                    We think data protection is important! <br />
                    <span className="text-accent font-medium">No data is sent.</span> The magic happens in your browser.
                </p>
            </Card>
            <Card className='bg-card border rounded-lg p-6 flex flex-col items-center justify-center text-center gap-4'>
                <Dialog>
                    <DialogTrigger asChild>
                        <Button variant="secondary" size="lg">
                            <Library className="mr-2 h-5 w-5" />
                            My Saved Palettes
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>My Saved Palettes</DialogTitle>
                        </DialogHeader>
                        <SavedPalettes savedPalettes={savedPalettes} setSavedPalettes={setSavedPalettes} setPalette={setPalette} />
                    </DialogContent>
                </Dialog>
            </Card>
        </div>
      </div>
    </div>
  );
}
