
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
  const containerRef = useRef<HTMLDivElement>(null);

  const [pickerState, setPickerState] = useState<{ x: number; y: number; color: string; } | null>(null);
  
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
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
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
  
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!image) return;
    const target = e.currentTarget;
    target.setPointerCapture(e.pointerId);

    const rect = target.getBoundingClientRect();
    const x = Math.round(e.clientX - rect.left);
    const y = Math.round(e.clientY - rect.top);
    updateLoupe(x, y);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    // Only move if the picker is active (i.e., pointer is down)
    if (!image || !pickerState) return;

    if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
    }
    
    const target = e.currentTarget;
    const clientX = e.clientX;
    const clientY = e.clientY;

    animationFrameRef.current = requestAnimationFrame(() => {
        const rect = target.getBoundingClientRect();
        const x = Math.round(clientX - rect.left);
        const y = Math.round(clientY - rect.top);
        
        if (x < 0 || y < 0 || x > rect.width || y > rect.height) {
            return;
        }

        updateLoupe(x, y);
    });
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
    }
    
    if (pickerState) {
        navigator.clipboard.writeText(pickerState.color);
        toast({ title: `Copied ${pickerState.color} to clipboard!` });
    }

    const target = e.currentTarget;
    if(target.hasPointerCapture(e.pointerId)) {
        target.releasePointerCapture(e.pointerId);
    }
    setPickerState(null);
  };


  return (
    <Card className="w-full max-w-4xl mx-auto overflow-hidden shadow-2xl shadow-primary/10 border-primary/20">
      <CardContent className="p-2 sm:p-4">
        <div 
          ref={containerRef}
          className={cn("relative aspect-video w-full rounded-lg overflow-hidden bg-muted flex items-center justify-center group select-none", image ? "cursor-crosshair" : "cursor-default")}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
        >
          {image ? (
            <Image ref={imageRef} src={image} alt="Uploaded preview" fill className="object-contain pointer-events-none" />
          ) : placeholderImage && (
            <Image src={placeholderImage.imageUrl} alt={placeholderImage.description} data-ai-hint={placeholderImage.imageHint} fill className="object-cover" priority />
          )}

          {pickerState && imageRef.current && (
            <>
                {/* The Loupe */}
                <div 
                    className="absolute pointer-events-none -translate-x-1/2 -translate-y-[calc(100%+2rem)] rounded-full w-32 h-32 border-4 border-white bg-white shadow-2xl overflow-hidden flex items-center justify-center"
                    style={{ 
                        left: pickerState.x, 
                        top: pickerState.y,
                        imageRendering: 'pixelated',
                    }}
                >
                    {/* Zoomed Image */}
                    <div style={{
                        position: 'absolute',
                        width: `${imageRef.current!.clientWidth * 5}px`,
                        height: `${imageRef.current!.clientHeight * 5}px`,
                        left: `${-pickerState.x * 5 + 64 - 2.5}px`,
                        top: `${-pickerState.y * 5 + 64 - 2.5}px`,
                    }}>
                        <Image src={image!} alt="Loupe view" fill className="object-contain" />
                    </div>
                    {/* Grid Overlay */}
                    <div className="absolute w-full h-full" style={{ backgroundSize: '12.8px 12.8px', backgroundImage: 'linear-gradient(to right, rgba(0,0,0,0.1) 1px, transparent 1px), linear-gradient(to bottom, rgba(0,0,0,0.1) 1px, transparent 1px)' }}/>

                    {/* Center Pixel Indicator */}
                    <div className="absolute w-[12.8px] h-[12.8px] border-2 border-red-500 bg-transparent" />
                </div>
                
                {/* Cursor Marker and Color Code */}
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
            pickerState ? "opacity-0" : "opacity-0 group-hover:opacity-100",
            image && !pickerState && "group-hover:opacity-0"
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

          {image && !pickerState && (
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

    