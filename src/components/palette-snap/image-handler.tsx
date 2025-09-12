"use client";

import Image from 'next/image';
import { Maximize } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { useRef, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '../ui/button';

interface ImageHandlerProps {
  image: string | null;
  imageRef: React.RefObject<HTMLImageElement>;
  pickerState: { x: number; y: number; color: string; } | null;
  setPickerState: (state: { x: number; y: number; color: string; } | null) => void;
  updateLoupe: (x: number, y: number) => void;
}

export function ImageHandler({ image, imageRef, pickerState, setPickerState, updateLoupe }: ImageHandlerProps) {
  const placeholderImage = PlaceHolderImages.find(p => p.id === 'palette-snap-placeholder');
  const containerRef = useRef<HTMLDivElement>(null);
  const animationFrameRef = useRef<number>();

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    target.setPointerCapture(e.pointerId);

    const rect = target.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    updateLoupe(x, y);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!e.currentTarget.hasPointerCapture(e.pointerId)) {
      return;
    }
    const target = e.currentTarget;

    if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
    }

    animationFrameRef.current = requestAnimationFrame(() => {
        const rect = target.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
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
    
    const target = e.currentTarget;
    if(target.hasPointerCapture(e.pointerId)) {
        target.releasePointerCapture(e.pointerId);
    }
    setPickerState(null);
  };

  const openFullScreen = () => {
    if (imageRef.current) {
        imageRef.current.requestFullscreen();
    }
  }

  return (
    <Card className="w-full overflow-hidden shadow-lg border-primary/10">
      <CardContent className="p-0">
        <div 
          ref={containerRef}
          className={cn(
            "relative aspect-video w-full overflow-hidden bg-muted flex items-center justify-center group select-none", 
            image && "cursor-crosshair"
          )}
          onPointerDown={image ? handlePointerDown : undefined}
          onPointerMove={image ? handlePointerMove : undefined}
          onPointerUp={image ? handlePointerUp : undefined}
          onPointerCancel={image ? handlePointerUp : undefined}
        >
          {image ? (
            <Image ref={imageRef} src={image} alt="Uploaded preview" fill className="object-contain pointer-events-none" />
          ) : placeholderImage && (
            <Image src={placeholderImage.imageUrl} alt={placeholderImage.description} data-ai-hint={placeholderImage.imageHint} fill className="object-cover" priority />
          )}

          {image && (
            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button variant="ghost" size="icon" className="bg-black/40 hover:bg-black/60 text-white hover:text-white" onClick={openFullScreen}>
                    <Maximize className="w-5 h-5" />
                </Button>
            </div>
          )}

          {pickerState && imageRef.current && (
            <>
                {/* The Loupe */}
                <div 
                    className="absolute pointer-events-none -translate-x-1/2 -translate-y-[calc(100%+1rem)] rounded-full w-24 h-24 border-4 border-white bg-white/30 backdrop-blur-sm shadow-2xl overflow-hidden flex items-center justify-center"
                    style={{ 
                        left: pickerState.x, 
                        top: pickerState.y,
                        imageRendering: 'pixelated',
                    }}
                >
                    {/* Zoomed Image */}
                    <div style={{
                        position: 'absolute',
                        width: `${imageRef.current!.clientWidth * 8}px`,
                        height: `${imageRef.current!.clientHeight * 8}px`,
                        left: `${-pickerState.x * 8 + 48 - 4}px`, // 48 is half of loupe width 96, 4 is half of pixel size 8
                        top: `${-pickerState.y * 8 + 48 - 4}px`,
                    }}>
                        <Image src={image!} alt="Loupe view" fill className="object-contain" />
                    </div>
                    {/* Grid Overlay & Center Pixel Indicator */}
                    <div className="absolute w-full h-full" style={{ backgroundSize: '8px 8px', backgroundImage: 'linear-gradient(to right, rgba(255,255,255,0.2) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.2) 1px, transparent 1px)' }}/>
                    <div className="absolute w-[8px] h-[8px] border border-red-500 bg-transparent" />
                </div>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
