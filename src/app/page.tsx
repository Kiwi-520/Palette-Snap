"use client";

import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useLocalStorage } from '@/lib/hooks/use-local-storage';
import { AppHeader } from '@/components/palette-snap/app-header';
import { ImageHandler } from '@/components/palette-snap/image-handler';
import { GeneratedPalette } from '@/components/palette-snap/generated-palette';
import { SavedPalettes } from '@/components/palette-snap/saved-palettes';
import { generatePaletteFromImage, type ColorHistogram } from '@/lib/color-quantizer';

export type Palette = string[];

export default function Home() {
  const [image, setImage] = useState<string | null>(null);
  const [palette, setPalette] = useState<Palette | null>(null);
  const [histogram, setHistogram] = useState<ColorHistogram | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [savedPalettes, setSavedPalettes] = useLocalStorage<Palette[]>('saved-palettes', []);
  const { toast } = useToast();

  const processImage = async (dataUrl: string) => {
    setImage(dataUrl);
    setPalette(null);
    setHistogram(null);
    setIsLoading(true);
    try {
      const newHistogram = await generatePaletteFromImage(dataUrl);
      setHistogram(newHistogram);
      // Create a simple palette from the top 6 colors for saving
      const newPalette = newHistogram.slice(0, 6).map(c => c.hex);
      setPalette(newPalette);
    } catch (error) {
      console.error("Failed to generate palette:", error);
      toast({
        variant: "destructive",
        title: "Palette Generation Failed",
        description: "Could not generate a color palette from the image.",
      });
    } finally {
      setIsLoading(false);
    }
  }

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
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
  
  const handleImageData = (dataUrl: string) => {
    processImage(dataUrl);
  }

  const savePalette = () => {
    if (palette) {
      if (savedPalettes.some(p => JSON.stringify(p) === JSON.stringify(palette))) {
        toast({ title: 'Palette already saved!' });
        return;
      }
      setSavedPalettes([palette, ...savedPalettes]);
      toast({ title: 'Palette saved!', description: 'You can find it in your saved palettes below.' });
    }
  };

  const removePalette = (index: number) => {
    setSavedPalettes(currentPalettes => currentPalettes.filter((_, i) => i !== index));
    toast({ title: 'Palette removed.' });
  };

  return (
    <div className="min-h-screen w-full bg-background font-body text-foreground">
      <AppHeader />
      <main className="container mx-auto px-4 pb-16">
        <ImageHandler image={image} onImageChange={handleImageChange} onImageData={handleImageData} />
        <GeneratedPalette isLoading={isLoading} histogram={histogram} onSave={savePalette} />
        <SavedPalettes savedPalettes={savedPalettes} onRemove={removePalette} />
      </main>
    </div>
  );
}
