'use client';

import { Loader2, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import type { ColorHistogram } from '@/lib/color-quantizer';

const SpectrumVisualizer = ({ histogram, onSave }: { histogram: ColorHistogram; onSave: () => void; }) => {
  const { toast } = useToast();

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: `Copied ${text} to clipboard!` });
  };

  const totalPixels = histogram.reduce((sum, item) => sum + item.count, 0);

  return (
    <div className="w-full flex flex-col items-center">
      <div className="w-full h-12 rounded-lg overflow-hidden flex shadow-md mb-4 border">
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
      <div className="w-full grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4 mb-8">
        {histogram.slice(0, 6).map((color, index) => (
          <div key={index} className="flex flex-col items-center gap-2 group">
            <div 
              className="w-full aspect-square rounded-lg shadow-md cursor-pointer transition-transform duration-200 group-hover:scale-105" 
              style={{ backgroundColor: color.hex }}
              onClick={() => copyToClipboard(color.hex)}
              title={`Click to copy ${color.hex}`}
            />
            <p className="font-code text-sm text-foreground/70 tracking-wider">{color.hex}</p>
          </div>
        ))}
      </div>
      <Button onClick={onSave} className="font-headline"><Save className="mr-2" /> Save Top 6 Colors</Button>
    </div>
  );
};

interface GeneratedPaletteProps {
    isLoading: boolean;
    histogram: ColorHistogram | null;
    onSave: () => void;
}

export function GeneratedPalette({ isLoading, histogram, onSave }: GeneratedPaletteProps) {
    return (
        <section className="mt-12">
            <h2 className="font-headline text-4xl text-center mb-6">Color Analysis</h2>
            <div className="w-full max-w-4xl mx-auto min-h-[12rem] bg-card p-6 rounded-lg shadow-lg border border-primary/10 flex items-center justify-center">
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
