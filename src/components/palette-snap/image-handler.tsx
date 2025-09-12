"use client";

import Image from 'next/image';
import { Maximize } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { useRef, useCallback, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '../ui/button';
import { applyColorBlindness, type BlindnessMode } from '@/lib/color-blindness';
import { DropdownMenu, DropdownMenuContent, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuTrigger } from '../ui/dropdown-menu';

interface ImageHandlerProps {
  image: string | null;
  filteredImage: string | null;
  setFilteredImage: (image: string | null) => void;
  imageRef: React.RefObject<HTMLImageElement>;
  pickerState: { x: number; y: number; color: string; } | null;
  onColorSelect: (state: { x: number; y: number; color: string; } | null) => void;
  updateLoupe: (x: number, y: number) => void;
  blindnessMode: BlindnessMode;
  setBlindnessMode: (mode: BlindnessMode) => void;
}

export function ImageHandler({ image, filteredImage, setFilteredImage, imageRef, pickerState, onColorSelect, updateLoupe, blindnessMode, setBlindnessMode }: ImageHandlerProps) {
  const placeholderImage = PlaceHolderImages.find(p => p.id === 'palette-snap-placeholder');
  const animationFrameRef = useRef<number>();

  useEffect(() => {
    if (!image) return;
    if (blindnessMode === 'none') {
      setFilteredImage(image);
      return;
    }

    const img = document.createElement('img');
    img.crossOrigin = "anonymous";
    img.src = image;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const context = canvas.getContext('2d');
      if (!context) return;
      context.drawImage(img, 0, 0);
      const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
      const simulatedData = applyColorBlindness(imageData, blindnessMode);
      context.putImageData(simulatedData, 0, 0);
      setFilteredImage(canvas.toDataURL());
    };
  }, [image, blindnessMode, setFilteredImage]);


  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    target.setPointerCapture(e.pointerId);

    const rect = target.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    updateLoupe(x, y);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!e.currentTarget.hasPointerCapture(e.pointerId)) return;
    
    if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
    }

    animationFrameRef.current = requestAnimationFrame(() => {
        const target = e.currentTarget;
        const rect = target.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        if (x >= 0 && y >= 0 && x <= rect.width && y <= rect.height) {
            updateLoupe(x, y);
        }
    });
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    e.currentTarget.releasePointerCapture(e.pointerId);
    if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
    }
    onColorSelect(pickerState);
  };

  const openFullScreen = () => {
    if (imageRef.current) {
        imageRef.current.requestFullscreen().catch(err => console.error(err));
    }
  }

  return (
    <Card className="w-full overflow-hidden shadow-lg border-primary/10">
      <CardContent className="p-0">
        <div 
          className={cn("relative aspect-video w-full overflow-hidden bg-muted flex items-center justify-center group select-none", image && "cursor-crosshair")}
          onPointerDown={image ? handlePointerDown : undefined}
          onPointerMove={image ? handlePointerMove : undefined}
          onPointerUp={image ? handlePointerUp : undefined}
          onPointerCancel={image ? handlePointerUp : undefined}
        >
          { (filteredImage || image) ? (
            <Image ref={imageRef} src={filteredImage || image!} alt="Uploaded preview" fill className="object-contain pointer-events-none" unoptimized/>
          ) : placeholderImage && (
            <>
              <Image src={placeholderImage.imageUrl} alt={placeholderImage.description} data-ai-hint={placeholderImage.imageHint} fill className="object-cover" priority />
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                <div className="text-center text-white p-4">
                  <h2 className="font-belleza text-3xl mb-2">Welcome to Palette Snap</h2>
                  <p className="font-alegreya text-lg">Upload an image or use your camera to get started.</p>
                </div>
              </div>
            </>
          )}

          {image && (
            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="bg-black/40 hover:bg-black/60 text-white hover:text-white">
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 18a6 6 0 0 0 0-12v12z"/></svg>
                      <span className="sr-only">Color Blindness Simulation</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuRadioGroup value={blindnessMode} onValueChange={(v) => setBlindnessMode(v as BlindnessMode)}>
                      <DropdownMenuRadioItem value="none">None</DropdownMenuRadioItem>
                      <DropdownMenuRadioItem value="protanopia">Protanopia</DropdownMenuRadioItem>
                      <DropdownMenuRadioItem value="deuteranopia">Deuteranopia</DropdownMenuRadioItem>
                      <DropdownMenuRadioItem value="tritanopia">Tritanopia</DropdownMenuRadioItem>
                      <DropdownMenuRadioItem value="achromatopsia">Achromatopsia</DropdownMenuRadioItem>
                    </DropdownMenuRadioGroup>
                  </DropdownMenuContent>
                </DropdownMenu>

                <Button variant="ghost" size="icon" className="bg-black/40 hover:bg-black/60 text-white hover:text-white" onClick={openFullScreen}>
                    <Maximize className="w-5 h-5" />
                </Button>
            </div>
          )}

          {pickerState && imageRef.current && filteredImage && (
            <div 
                className="absolute pointer-events-none -translate-x-1/2 -translate-y-[calc(100%+1rem)] rounded-full w-24 h-24 border-4 border-white bg-white/30 backdrop-blur-sm shadow-2xl overflow-hidden flex items-center justify-center"
                style={{ 
                    left: pickerState.x, 
                    top: pickerState.y,
                    imageRendering: 'pixelated',
                }}
            >
                <div style={{
                    position: 'absolute',
                    width: `${imageRef.current!.clientWidth * 8}px`,
                    height: `${imageRef.current!.clientHeight * 8}px`,
                    left: `${-pickerState.x * 8 + 44}px`,
                    top: `${-pickerState.y * 8 + 44}px`,
                }}>
                    <Image src={filteredImage} alt="Loupe view" fill className="object-contain" unoptimized />
                </div>
                <div className="absolute w-full h-full" style={{ backgroundSize: '8px 8px', backgroundImage: 'linear-gradient(to right, rgba(255,255,255,0.2) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.2) 1px, transparent 1px)' }}/>
                <div className="absolute w-[8px] h-[8px] border border-red-500 bg-transparent" />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
