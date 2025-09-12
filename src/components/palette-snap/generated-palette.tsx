"use client";
import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { hexToRgb, rgbToHex, rgbToHsl, hslToRgb } from '@/lib/color-converter';
import { useToast } from "@/hooks/use-toast";
import { cn } from '@/lib/utils';
import type { Palette } from '@/app/page';
import { Button } from '../ui/button';
import { Download } from 'lucide-react';

interface GeneratedPaletteProps {
  baseColors: string[];
}

// Correctly generates a complementary palette based on all base colors
function generateComplementaryPalette(baseColors: string[]): Palette {
  if (baseColors.length === 0) return [];

  // This function finds the true complementary color using an HSL hue shift
  const getComplementary = (hex: string): string => {
    const rgb = hexToRgb(hex);
    if (!rgb) return hex;

    // Convert to HSL to perform a correct hue shift
    const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
    
    // Correctly find the complement by shifting the hue by 180 degrees
    hsl.h = (hsl.h + 180) % 360;

    // Convert the new HSL value back to RGB and then to HEX
    const compRgb = hslToRgb(hsl.h, hsl.s, hsl.l);
    return rgbToHex(compRgb.r, compRgb.g, compRgb.b);
  };
  
  // This function changes the lightness of a color in HSL space
  const changeLightness = (hex: string, amount: number): string => {
    const rgb = hexToRgb(hex);
    if (!rgb) return hex;
    const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
    hsl.l = Math.max(0, Math.min(1, hsl.l + amount));
    const newRgb = hslToRgb(hsl.h, hsl.s, hsl.l);
    return rgbToHex(newRgb.r, newRgb.g, newRgb.b);
  }

  const complementaryPalette: Palette = [];
  
  // Iterate over all base colors from the image palette to create a diverse complementary palette
  baseColors.forEach(color => {
    const complementary = getComplementary(color);
    complementaryPalette.push(complementary);
  });
  
  // If we have less than 10 colors, create tints and shades to fill the palette
  if (complementaryPalette.length < 10) {
      const shadesAndTints = [];
      complementaryPalette.forEach(color => {
          shadesAndTints.push(changeLightness(color, 0.1));
          shadesAndTints.push(changeLightness(color, -0.1));
      });
      // Combine original complements with their shades and tints, and remove duplicates
      const fullPalette = [...new Set([...complementaryPalette, ...shadesAndTints])];
      // Sort by hue for visual harmony and slice to get a fixed size
      return fullPalette.slice(0, 10);
  }

  // If we have 10 or more colors, just return a unique set of the first 10
  return [...new Set(complementaryPalette)].slice(0, 10);
}


export function GeneratedPalette({ baseColors }: GeneratedPaletteProps) {
    const { toast } = useToast();
    const palette = useMemo(() => generateComplementaryPalette(baseColors), [baseColors]);

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        toast({ title: `Copied ${text} to clipboard!` });
    };

    const downloadPalette = () => {
        const canvas = document.createElement('canvas');
        const canvasContext = canvas.getContext('2d');
        if (!canvasContext) return;

        const colorHeight = 100;
        const colorWidth = 100;
        canvas.width = palette.length * colorWidth;
        canvas.height = colorHeight;

        palette.forEach((color, index) => {
            canvasContext.fillStyle = color;
            canvasContext.fillRect(index * colorWidth, 0, colorWidth, colorHeight);
        });

        const link = document.createElement('a');
        link.download = 'complementary-palette.png';
        link.href = canvas.toDataURL('image/png');
        link.click();
    }

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle className="font-belleza">Suggested Complementary Palette</CardTitle>
        <div className="flex border rounded-md">
            <Button variant="ghost" size="icon" onClick={downloadPalette} className="rounded-md" title="Download as PNG">
                <Download className="w-4 h-4" />
            </Button>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col md:flex-row items-center gap-4 pt-2">
        <div className="flex-grow grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-10 gap-1 w-full">
            {palette.map((color, index) => (
                <div 
                    key={index} 
                    className="h-10 rounded-md w-full cursor-pointer transition-transform hover:scale-110" 
                    style={{ backgroundColor: color }}
                    onClick={() => copyToClipboard(color)}
                    title={`Copy ${color}`}
                />
            ))}
            {Array.from({ length: 10 - palette.length }).map((_, index) => (
                <div key={index} className={cn("h-10 rounded-md w-full bg-muted/50")} />
            ))}
        </div>
      </CardContent>
    </Card>
  );
}
