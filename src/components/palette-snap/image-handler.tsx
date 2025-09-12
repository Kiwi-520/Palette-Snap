'use client';

import Image from 'next/image';
import { Camera } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { PlaceHolderImages, type ImagePlaceholder } from '@/lib/placeholder-images';

interface ImageHandlerProps {
  image: string | null;
  onImageChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

export function ImageHandler({ image, onImageChange }: ImageHandlerProps) {
  const placeholderImage = PlaceHolderImages.find(p => p.id === 'palette-snap-placeholder');

  return (
    <Card className="w-full max-w-4xl mx-auto overflow-hidden shadow-2xl shadow-primary/10 border-primary/20">
      <CardContent className="p-2 sm:p-4">
        <div className="relative aspect-video w-full rounded-lg overflow-hidden bg-muted flex items-center justify-center group">
          {image ? (
            <Image src={image} alt="Uploaded preview" fill className="object-contain" />
          ) : placeholderImage && (
            <Image src={placeholderImage.imageUrl} alt={placeholderImage.description} data-ai-hint={placeholderImage.imageHint} fill className="object-cover" priority />
          )}
          <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <Button asChild size="lg" className="font-headline">
              <label htmlFor="image-upload" className="cursor-pointer">
                <Camera className="mr-2 h-6 w-6" />
                Upload Image
              </label>
            </Button>
            <input
              id="image-upload"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={onImageChange}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
