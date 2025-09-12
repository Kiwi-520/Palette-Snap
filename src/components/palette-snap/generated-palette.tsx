"use client";
import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { hexToRgb, rgbToHex, rgbToHsl, hslToRgb } from '@/lib/color-converter';
import { useToast } from "@/hooks/use-toast";
import { cn } from '@/lib/utils';
import { Palette } from '@/app/page';
import { Button } from '../ui/button';
import { Copy, Download } from 'lucide-react';

interface GeneratedPaletteProps {
  baseColors: string[];
}

function generateShades(rgb: {r:number, g:number, b:number}, count: number) {
    const shades = [];
    for(let i=0; i<count; i++) {
        const factor = i / (count - 1);
        shades.push({
            r: Math.round(rgb.r * factor),
            g: Math.round(rgb.g * factor),
            b: Math.round(rgb.b * factor),
        });
    }
    return shades.map(s => rgbToHex(s.r, s.g, s.b));
}

function generateTints(rgb: {r:number, g:number, b:number}, count: number) {
    const tints = [];
    for(let i=0; i<count; i++) {
        const factor = i / (count - 1);
        tints.push({
            r: Math.round(rgb.r + (255 - rgb.r) * factor),
            g: Math.round(rgb.g + (255 - rgb.g) * factor),
            b: Math.round(rgb.b + (255 - rgb.b) * factor),
        });
    }
    return tints.map(t => rgbToHex(t.r, t.g, t.b));
}


function generateComplementaryPalette(baseColors: string[]): Palette {
  const palette: string[] = [];
  const MAX_COLORS = 10;
  const colorsPerBase = Math.floor(MAX_COLORS / (baseColors.length * 2));
  
  if (baseColors.length === 0) return [];

  const getComplementary = (hex: string) => {
    const rgb = hexToRgb(hex);
    if(!rgb) return hex;
    const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
    hsl.h = (hsl.h + 180) % 360;
    const compRgb = hslToRgb(hsl.h, hsl.s, hsl.l);
    return rgbToHex(compRgb.r, compRgb.g, compRgb.b);
  };

  baseColors.forEach(color => {
    // Add original color variations
    const originalRgb = hexToRgb(color);
    if(originalRgb) {
        const tints = generateTints(originalRgb, Math.ceil(colorsPerBase / 2) + 1).slice(0, -1);
        const shades = generateShades(originalRgb, Math.floor(colorsPerBase / 2) + 1).slice(1);
        palette.push(...tints, color, ...shades);
    }
    
    // Add complementary color variations
    const complementaryHex = getComplementary(color);
    const complementaryRgb = hexToRgb(complementaryHex);
    if(complementaryRgb) {
        const tints = generateTints(complementaryRgb, Math.ceil(colorsPerBase / 2) + 1).slice(0, -1);
        const shades = generateShades(complementaryRgb, Math.floor(colorsPerBase / 2) + 1).slice(1);
        palette.push(...tints, complementaryHex, ...shades);
    }
  });

  // Ensure palette has exactly 10 colors
  return palette.slice(0, MAX_COLORS);
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
            <Button variant="ghost" size="icon" onClick={downloadPalette} className="rounded-l-none" title="Download as PNG">
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
