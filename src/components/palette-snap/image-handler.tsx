'use client';

import Image from 'next/image';
import { Camera, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { PlaceHolderImages, type ImagePlaceholder } from '@/lib/placeholder-images';
import { useState } from 'react';
import { CameraCapture } from './camera-capture';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';

interface ImageHandlerProps {
  image: string | null;
  onImageChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onImageData: (imageData: string) => void;
}

export function ImageHandler({ image, onImageChange, onImageData }: ImageHandlerProps) {
  const placeholderImage = PlaceHolderImages.find(p => p.id === 'palette-snap-placeholder');
  const [isCameraOpen, setIsCameraOpen] = useState(false);

  const handleCapture = (imageData: string) => {
    onImageData(imageData);
    setIsCameraOpen(false);
  }

  return (
    <Card className="w-full max-w-4xl mx-auto overflow-hidden shadow-2xl shadow-primary/10 border-primary/20">
      <CardContent className="p-2 sm:p-4">
        <div className="relative aspect-video w-full rounded-lg overflow-hidden bg-muted flex items-center justify-center group">
          {image ? (
            <Image src={image} alt="Uploaded preview" fill className="object-contain" />
          ) : placeholderImage && (
            <Image src={placeholderImage.imageUrl} alt={placeholderImage.description} data-ai-hint={placeholderImage.imageHint} fill className="object-cover" priority />
          )}
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 gap-4">
            <Button asChild size="lg" className="font-headline">
              <label htmlFor="image-upload" className="cursor-pointer">
                <Upload className="mr-2 h-6 w-6" />
                Upload Image
              </label>
            </Button>
            <Dialog open={isCameraOpen} onOpenChange={setIsCameraOpen}>
              <DialogTrigger asChild>
                <Button size="lg" className="font-headline" variant="secondary">
                  <Camera className="mr-2 h-6 w-6" />
                  Use Camera
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-3xl p-4">
                <CameraCapture onCapture={handleCapture} />
              </DialogContent>
            </Dialog>

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
