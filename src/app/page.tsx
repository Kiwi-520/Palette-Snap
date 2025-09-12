"use client";

import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { AppHeader } from '@/components/palette-snap/app-header';
import { ImageHandler } from '@/components/palette-snap/image-handler';
import { GeneratedPalette } from '@/components/palette-snap/generated-palette';
import { generatePaletteFromImage, type ColorHistogram } from '@/lib/color-quantizer';

export type Palette = string[];

export default function Home() {
  const [image, setImage] = useState<string | null>(null);
  const [histogram, setHistogram] = useState<ColorHistogram | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const processImage = async (dataUrl: string) => {
    setImage(dataUrl);
    setHistogram(null);
    setIsLoading(true);
    try {
      const newHistogram = await generatePaletteFromImage(dataUrl);
      setHistogram(newHistogram);
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

  return (
    <div className="min-h-screen w-full bg-background font-body text-foreground">
      <AppHeader />
      <main className="container mx-auto px-4 pb-16">
        <ImageHandler image={image} onImageChange={handleImageChange} onImageData={handleImageData} />
        <GeneratedPalette isLoading={isLoading} histogram={histogram} />
      </main>
    </div>
  );
}
