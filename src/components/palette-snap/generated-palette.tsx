
'use client';

import { useState, useMemo } from 'react';
import { Loader2, Wand2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import type { ColorHistogram } from '@/lib/color-quantizer';
import { cn } from '@/lib/utils';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import type { Palette } from '@/app/page';

// --- Color Conversion Utilities ---
function hexToRgb(hex: string): { r: number; g: number; b: number } {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : { r: 0, g: 0, b: 0 };
}

function rgbToHex(r: number, g: number, b: number): string {
    const rInt = Math.max(0, Math.min(255, Math.round(r)));
    const gInt = Math.max(0, Math.min(255, Math.round(g)));
    const bInt = Math.max(0, Math.min(255, Math.round(b)));
    return "#" + ((1 << 24) + (rInt << 16) + (gInt << 8) + bInt).toString(16).slice(1).toUpperCase();
}

function rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h = 0, s = 0, l = (max + min) / 2;
    if (max !== min) {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
        }
        h /= 6;
    }
    return { h: h * 360, s, l };
}

function hslToRgb(h: number, s: number, l: number): { r: number; g: number; b: number } {
    let r, g, b;
    if (s === 0) {
        r = g = b = l;
    } else {
        const hue2rgb = (p: number, q: number, t: number) => {
            if (t < 0) t += 1;
            if (t > 1) t -= 1;
            if (t < 1 / 6) return p + (q - p) * 6 * t;
            if (t < 1 / 2) return q;
            if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
            return p;
        };
        const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        const p = 2 * l - q;
        h /= 360;
        r = hue2rgb(p, q, h + 1 / 3);
        g = hue2rgb(p, q, h);
        b = hue2rgb(p, q, h - 1 / 3);
    }
    return { r: r * 255, g: g * 255, b: b * 255 };
}

// --- Algorithmic Palette Generation ---
function generateComplementaryPalette(baseColors: string[]): Palette {
    const finalPalette: Set<string> = new Set();
    const totalColors = 10;
    const basePaletteSize = Math.floor(totalColors / 2);
    const complementPaletteSize = totalColors - basePaletteSize;

    // Helper to generate shades and tints
    const generateShades = (hsl: {h: number, s: number, l: number}, count: number): string[] => {
        const shades: string[] = [];
        // Add the base color itself
        shades.push(rgbToHex(hslToRgb(hsl.h, hsl.s, hsl.l).r, hslToRgb(hsl.h, hsl.s, hsl.l).g, hslToRgb(hsl.h, hsl.s, hsl.l).b));
        
        // Generate tints (lighter) and shades (darker)
        for(let i = 1; shades.length < count; i++) {
            // Add a tint
            const lighterL = Math.min(0.95, hsl.l + i * 0.1);
            const {r: r1, g: g1, b: b1} = hslToRgb(hsl.h, hsl.s, lighterL);
            shades.push(rgbToHex(r1, g1, b1));
            if(shades.length >= count) break;

            // Add a shade
            const darkerL = Math.max(0.05, hsl.l - i * 0.1);
            const {r: r2, g: g2, b: b2} = hslToRgb(hsl.h, hsl.s, darkerL);
            shades.push(rgbToHex(r2, g2, b2));
        }
        return shades.slice(0, count);
    }

    // 1. Generate colors from the selected base colors
    const baseColorsHSL = baseColors.map(hex => rgbToHsl(hexToRgb(hex).r, hexToRgb(hex).g, hexToRgb(hex).b));
    let distributedBaseCount = 0;
    baseColorsHSL.forEach((hsl, index) => {
        const numToAdd = Math.ceil(basePaletteSize / baseColorsHSL.length) + (index < basePaletteSize % baseColorsHSL.length ? 1 : 0);
        const shades = generateShades(hsl, numToAdd);
        shades.forEach(shade => {
            if (distributedBaseCount < basePaletteSize) {
                finalPalette.add(shade);
                distributedBaseCount++;
            }
        });
    });

    // 2. Generate colors from the complementary colors
    let distributedComplementCount = 0;
    baseColorsHSL.forEach((hsl, index) => {
        const complementaryHsl = { ...hsl, h: (hsl.h + 180) % 360 };
        const numToAdd = Math.ceil(complementPaletteSize / baseColorsHSL.length) + (index < complementPaletteSize % baseColorsHSL.length ? 1 : 0);
        const shades = generateShades(complementaryHsl, numToAdd);
        shades.forEach(shade => {
            if (distributedComplementCount < complementPaletteSize) {
                finalPalette.add(shade);
                distributedComplementCount++;
            }
        });
    });

    return Array.from(finalPalette).slice(0, totalColors);
}

const SpectrumVisualizer = ({ histogram }: { histogram: ColorHistogram; }) => {
  const { toast } = useToast();
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [suggestedPalette, setSuggestedPalette] = useState<Palette | null>(null);
  const [isSuggesting, setIsSuggesting] = useState(false);
  
  const sortedHistogram = useMemo(() => {
    // Pre-calculate HSL values for sorting efficiency
    const histogramWithHsl = histogram.map(color => {
      const { r, g, b } = hexToRgb(color.hex);
      return { ...color, hsl: rgbToHsl(r, g, b) };
    });

    // Sort based on hue, then saturation, then lightness
    return histogramWithHsl.sort((a, b) => {
      if (a.hsl.h < b.hsl.h) return -1;
      if (a.hsl.h > b.hsl.h) return 1;
      if (a.hsl.s < b.hsl.s) return -1;
      if (a.hsl.s > b.hsl.s) return 1;
      if (a.hsl.l < b.hsl.l) return -1;
      if (a.hsl.l > b.hsl.l) return 1;
      return 0;
    });
  }, [histogram]);

  const handleSuggestPalette = () => {
    if (selectedColors.length === 0) {
      toast({ title: 'Select some colors first!', description: 'Choose colors from the grid to generate a complementary palette.'});
      return;
    }
    setIsSuggesting(true);
    setSuggestedPalette(null);
    // Use a short timeout to allow the UI to update to the loading state
    setTimeout(() => {
      const newPalette = generateComplementaryPalette(selectedColors);
      setSuggestedPalette(newPalette);
      setIsSuggesting(false);
    }, 50);
  };

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
          {sortedHistogram.map((color, index) => {
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
      
      <div className="flex flex-wrap items-center justify-center gap-4">
        <Button onClick={handleSuggestPalette} disabled={isSuggesting || selectedColors.length === 0} variant="secondary" className="font-headline">
          {isSuggesting ? <Loader2 className="mr-2 animate-spin" /> : <Wand2 className="mr-2" />}
          Suggest Complementary
        </Button>
      </div>
      
      {suggestedPalette && (
        <div className="mt-8 w-full max-w-4xl">
            <h3 className="font-headline text-2xl text-center mb-4">Suggested Palette</h3>
            <div className="grid grid-cols-5 sm:grid-cols-10 gap-4">
                {suggestedPalette.map((color, index) => (
                    <div key={index} className="flex flex-col items-center gap-2 group">
                        <div 
                            className="w-full aspect-square rounded-lg shadow-md cursor-pointer transition-transform duration-200 group-hover:scale-105" 
                            style={{ backgroundColor: color }}
                            onClick={() => copyToClipboard(color)}
                            title={`Click to copy ${color}`}
                        />
                        <p className="font-code text-xs sm:text-sm text-foreground/70 tracking-wider">{color}</p>
                    </div>
                ))}
            </div>
        </div>
      )}
    </div>
  );
};

interface GeneratedPaletteProps {
    isLoading: boolean;
    histogram: ColorHistogram | null;
}

export function GeneratedPalette({ isLoading, histogram }: GeneratedPaletteProps) {
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
                    <SpectrumVisualizer histogram={histogram} />
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
