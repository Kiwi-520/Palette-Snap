'use client';

import Image from 'next/image';
import { Camera, Upload, Pipette } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { useState, useRef, useEffect } from 'react';
import { CameraCapture } from './camera-capture';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';

interface ImageHandlerProps {
  image: string | null;
  onImageChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onImageData: (imageData: string) => void;
}

export function ImageHandler({ image, onImageChange, onImageData }: ImageHandlerProps) {
  const placeholderImage = PlaceHolderImages.find(p => p.id === 'palette-snap-placeholder');
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  
  const imageRef = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [loupePosition, setLoupePosition] = useState<{ x: number; y: number } | null>(null);
  const [pickedColor, setPickedColor] = useState<string | null>(null);
  const { toast } = useToast();

  const handleCapture = (imageData: string) => {
    onImageData(imageData);
    setIsCameraOpen(false);
  };

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

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setLoupePosition({ x, y });

    if (canvasRef.current) {
      const context = canvasRef.current.getContext('2d');
      if (context) {
        const pixel = context.getImageData(x, y, 1, 1).data;
        const hex = `#${('000000' + ((pixel[0] << 16) | (pixel[1] << 8) | pixel[2]).toString(16)).slice(-6).toUpperCase()}`;
        setPickedColor(hex);
      }
    }
  };

  const handleMouseLeave = () => {
    setLoupePosition(null);
    setPickedColor(null);
  };
  
  const handleColorClick = () => {
    if (pickedColor) {
        navigator.clipboard.writeText(pickedColor);
        toast({ title: `Copied ${pickedColor} to clipboard!` });
    }
  }

  return (
    <Card className="w-full max-w-4xl mx-auto overflow-hidden shadow-2xl shadow-primary/10 border-primary/20">
      <CardContent className="p-2 sm:p-4">
        <div 
          className="relative aspect-video w-full rounded-lg overflow-hidden bg-muted flex items-center justify-center group cursor-crosshair"
          onMouseMove={image ? handleMouseMove : undefined}
          onMouseLeave={image ? handleMouseLeave : undefined}
          onClick={image ? handleColorClick : undefined}
        >
          {image ? (
            <Image ref={imageRef} src={image} alt="Uploaded preview" fill className="object-contain pointer-events-none" />
          ) : placeholderImage && (
            <Image src={placeholderImage.imageUrl} alt={placeholderImage.description} data-ai-hint={placeholderImage.imageHint} fill className="object-cover" priority />
          )}

          {loupePosition && image && (
            <div 
                className="absolute pointer-events-none rounded-full w-24 h-24 border-4 border-white shadow-2xl overflow-hidden"
                style={{ 
                    left: loupePosition.x - 48, 
                    top: loupePosition.y - 48,
                    imageRendering: 'pixelated',
                }}
            >
                <div style={{
                    position: 'absolute',
                    width: `${imageRef.current!.clientWidth * 4}px`,
                    height: `${imageRef.current!.clientHeight * 4}px`,
                    left: `${-loupePosition.x * 4 + 48}px`,
                    top: `${-loupePosition.y * 4 + 48}px`,
                }}>
                    <Image src={image} alt="Loupe view" fill className="object-contain" />
                </div>
            </div>
          )}
          
          {pickedColor && loupePosition && (
            <div className="absolute font-code text-white bg-black/70 px-2 py-1 rounded-md text-sm pointer-events-none"
             style={{ 
                left: loupePosition.x + 10,
                top: loupePosition.y + 60,
             }}
            >
              {pickedColor}
            </div>
          )}

          <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 gap-4">
            {!image && <Pipette className="h-16 w-16 text-white/50" />}
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
              onChange={onImageChange}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
