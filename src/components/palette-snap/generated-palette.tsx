'use client';

import { useState } from 'react';
import { Loader2, Save, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import type { ColorHistogram } from '@/lib/color-quantizer';
import { cn } from '@/lib/utils';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';

const SpectrumVisualizer = ({ histogram, onSave }: { histogram: ColorHistogram; onSave: (palette: string[]) => void; }) => {
  const { toast } = useToast();
  const [selectedColors, setSelectedColors] = useState<string[]>([]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: `Copied ${text} to clipboard!` });
  };

  const toggleColorSelection = (hex: string) => {
    setSelectedColors(currentSelected =>
      currentSelected.includes(hex)
        ? currentSelected.filter(c => c !== hex)
        : [...currentSelected, hex]
    );
  };

  const totalPixels = histogram.reduce((sum, item) => sum + item.count, 0);

  return (
    <div className="w-full flex flex-col items-center">
      {/* Spectrum Bar */}
      <div className="w-full h-12 rounded-lg overflow-hidden flex shadow-md mb-8 border" title="Color spectrum from image">
        {histogram.map(({ hex, count }, index) => (
          <div
            key={index}
            className="h-full transition-all duration-200 hover:opacity-80"
            style={{
              backgroundColor: hex,
              width: `${(count / totalPixels) * 100}%`,
            }}
            title={`${hex} (${((count / totalPixels) * 100).toFixed(2)}%)`}
            onClick={() => copyToClipboard(hex)}
          />
        ))}
      </div>
      
      {/* All Colors Grid */}
      <p className="font-headline text-lg mb-4 text-foreground/80">Select colors to build your palette</p>
      <ScrollArea className="w-full h-72 mb-8">
        <div className="w-full grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-4 pr-4">
          {histogram.map((color, index) => {
            const isSelected = selectedColors.includes(color.hex);
            return (
              <div key={index} className="flex flex-col items-center gap-2 group" onClick={() => toggleColorSelection(color.hex)}>
                <div 
                  className={cn(
                    "w-full aspect-square rounded-lg shadow-md cursor-pointer transition-all duration-200 group-hover:scale-105 border-2",
                    isSelected ? "border-primary ring-2 ring-primary/50" : "border-transparent"
                  )}
                  style={{ backgroundColor: color.hex }}
                  title={`Click to select ${color.hex}`}
                >
                  {isSelected && (
                    <div className="w-full h-full flex items-center justify-center bg-black/30">
                        <Check className="w-6 h-6 text-white" />
                    </div>
                  )}
                </div>
                <p 
                    className="font-code text-xs text-foreground/70 tracking-wider cursor-pointer"
                    onClick={(e) => { e.stopPropagation(); copyToClipboard(color.hex); }}
                    title={`Click to copy ${color.hex}`}
                >
                    {color.hex}
                </p>
              </div>
            );
          })}
        </div>
        <ScrollBar orientation="vertical" />
      </ScrollArea>
      
      <Button onClick={() => onSave(selectedColors)} disabled={selectedColors.length === 0} className="font-headline">
        <Save className="mr-2" /> 
        Save Selected Colors ({selectedColors.length})
      </Button>
    </div>
  );
};

interface GeneratedPaletteProps {
    isLoading: boolean;
    histogram: ColorHistogram | null;
    onSave: (palette: string[]) => void;
}

export function GeneratedPalette({ isLoading, histogram, onSave }: GeneratedPaletteProps) {
    return (
        <section className="mt-12">
            <h2 className="font-headline text-4xl text-center mb-6">Color Analysis</h2>
            <div className="w-full max-w-6xl mx-auto min-h-[20rem] bg-card p-6 rounded-lg shadow-lg border border-primary/10 flex items-center justify-center">
                {isLoading ? (
                    <div className="flex flex-col items-center gap-4 text-primary">
                        <Loader2 className="h-12 w-12 animate-spin" />
                        <p className="font-headline text-lg opacity-80">Analyzing your image...</p>
                    </div>
                ) : histogram && histogram.length > 0 ? (
                    <SpectrumVisualizer histogram={histogram} onSave={onSave} />
                ) : (
                    <div className="text-center text-foreground/60">
                      <p className="font-headline text-xl">Upload an image or use your camera</p>
                      <p className="font-body">A full color analysis will be generated for you.</p>
                    </div>
                )}
            </div>
        </section>
    );
}
