
'use client';

import Image from 'next/image';
import { Camera, Upload, Pipette, Move } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { useState, useRef, useEffect, useCallback } from 'react';
import { CameraCapture } from './camera-capture';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

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
  const animationFrameRef = useRef<number>();

  const [pickerState, setPickerState] = useState<{ x: number; y: number; color: string; } | null>(null);
  const [isPicking, setIsPicking] = useState(false);

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
      
      setPickerState(null);
      setIsPicking(false);
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    }
  }, [image]);

  const updateLoupe = useCallback((x: number, y: number) => {
    if (!canvasRef.current) return;
  
    const context = canvasRef.current.getContext('2d');
    if (context) {
      const pixel = context.getImageData(x, y, 1, 1).data;
      const color = `#${('000000' + ((pixel[0] << 16) | (pixel[1] << 8) | pixel[2]).toString(16)).slice(-6).toUpperCase()}`;
      setPickerState({ x, y, color });
    }
  }, []);

  const handlePointerDown = (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
    if (!image) return;
    setIsPicking(true);
    const rect = e.currentTarget.getBoundingClientRect();
    const touch = 'touches' in e ? e.touches[0] : e;
    const x = Math.round(touch.clientX - rect.left);
    const y = Math.round(touch.clientY - rect.top);
    updateLoupe(x, y);
  };

  const handlePointerMove = (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
    if (!isPicking || !image) return;

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    
    // Capture the target and event details before the animation frame
    const currentTarget = e.currentTarget;
    const touch = 'touches' in e ? e.touches[0] : e;
    const clientX = touch.clientX;
    const clientY = touch.clientY;

    animationFrameRef.current = requestAnimationFrame(() => {
      const rect = currentTarget.getBoundingClientRect();
      const x = Math.round(clientX - rect.left);
      const y = Math.round(clientY - rect.top);

      if (x < 0 || y < 0 || x > rect.width || y > rect.height) {
        setIsPicking(false);
        return;
      }

      updateLoupe(x, y);
    });
  };

  const handlePointerUp = () => {
    if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
    }
    if (isPicking && pickerState) {
        navigator.clipboard.writeText(pickerState.color);
        toast({ title: `Copied ${pickerState.color} to clipboard!` });
    }
    setIsPicking(false);
  };

  return (
    <Card className="w-full max-w-4xl mx-auto overflow-hidden shadow-2xl shadow-primary/10 border-primary/20">
      <CardContent className="p-2 sm:p-4">
        <div 
          className={cn("relative aspect-video w-full rounded-lg overflow-hidden bg-muted flex items-center justify-center group select-none", image ? "cursor-crosshair" : "cursor-default")}
          onMouseDown={handlePointerDown}
          onMouseMove={handlePointerMove}
          onMouseUp={handlePointerUp}
          onMouseLeave={handlePointerUp}
          onTouchStart={handlePointerDown}
          onTouchMove={handlePointerMove}
          onTouchEnd={handlePointerUp}
        >
          {image ? (
            <Image ref={imageRef} src={image} alt="Uploaded preview" fill className="object-contain pointer-events-none" />
          ) : placeholderImage && (
            <Image src={placeholderImage.imageUrl} alt={placeholderImage.description} data-ai-hint={placeholderImage.imageHint} fill className="object-cover" priority />
          )}

          {isPicking && pickerState && imageRef.current && (
            <>
                <div 
                    className="absolute pointer-events-none -translate-x-1/2 -translate-y-[calc(100%+2rem)] rounded-full w-32 h-32 border-4 border-white bg-white shadow-2xl overflow-hidden flex items-center justify-center"
                    style={{ 
                        left: pickerState.x, 
                        top: pickerState.y,
                        imageRendering: 'pixelated',
                    }}
                >
                    <div style={{
                        position: 'absolute',
                        width: `${imageRef.current!.clientWidth * 5}px`,
                        height: `${imageRef.current!.clientHeight * 5}px`,
                        left: `${-pickerState.x * 5 + 64}px`,
                        top: `${-pickerState.y * 5 + 64}px`,
                    }}>
                        <Image src={image!} alt="Loupe view" fill className="object-contain" />
                    </div>
                    <div className="absolute w-full h-full">
                        <div className="absolute top-1/2 left-0 w-full h-[2px] bg-black/30 -translate-y-[1px]"></div>
                        <div className="absolute left-1/2 top-0 h-full w-[2px] bg-black/30 -translate-x-[1px]"></div>
                    </div>
                </div>
                <div 
                    className="absolute pointer-events-none -translate-x-1/2 -translate-y-1/2"
                    style={{ left: pickerState.x, top: pickerState.y }}
                >
                    <div className="absolute bottom-4 -translate-y-full w-max -translate-x-1/2">
                        <div className="font-code text-white bg-black/80 px-2 py-1 rounded-md text-sm shadow-lg flex items-center gap-2">
                           <div className="w-4 h-4 rounded-full border-2 border-white" style={{ backgroundColor: pickerState.color }} />
                           {pickerState.color}
                        </div>
                    </div>
                    <div className="w-4 h-4 rounded-full bg-transparent border-2 border-white/80 ring-2 ring-black/50 shadow-2xl" />
                </div>
            </>
          )}

          <div className={cn("absolute inset-0 bg-black/40 flex-col sm:flex-row items-center justify-center gap-4 transition-opacity duration-300",
            isPicking ? "opacity-0" : "opacity-0 group-hover:opacity-100",
            image && !isPicking && "group-hover:opacity-0"
          )}>
            {!image && <Pipette className="h-16 w-16 text-white/50 hidden sm:block" />}
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

          {image && !isPicking && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 pointer-events-none">
              <div className="flex items-center gap-2 bg-black/60 text-white font-headline text-sm px-3 py-2 rounded-lg">
                <Move className="h-5 w-5"/>
                Click and drag to pick a color
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
