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

function generateComplementaryPalette(baseColors: string[]): Palette {
  if (baseColors.length === 0) return [];
  const MAX_COLORS = 10;
  
  const getComplementary = (hex: string) => {
    const rgb = hexToRgb(hex);
    if (!rgb) return hex;
    const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
    hsl.h = (hsl.h + 180) % 360; // Correct 180-degree hue shift
    const compRgb = hslToRgb(hsl.h, hsl.s, hsl.l);
    return rgbToHex(compRgb.r, compRgb.g, compRgb.b);
  };
  
  const changeLightness = (hex: string, amount: number) => {
    const rgb = hexToRgb(hex);
    if (!rgb) return hex;
    const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
    hsl.l = Math.max(0, Math.min(1, hsl.l + amount)); // Correctly add/subtract lightness
    const newRgb = hslToRgb(hsl.h, hsl.s, hsl.l);
    return rgbToHex(newRgb.r, newRgb.g, newRgb.b);
  }

  // Use the first and a middle color for variety
  const primaryBase = baseColors[0];
  const secondaryBase = baseColors.length > 1 ? baseColors[Math.floor(baseColors.length / 2)] : baseColors[0];

  const primaryComp = getComplementary(primaryBase);
  
  const finalPalette = [
    changeLightness(primaryBase, 0.2), // Light tint
    changeLightness(primaryBase, 0.1), // Softer tint
    primaryBase, // Base
    changeLightness(primaryBase, -0.1), // Shade
    changeLightness(primaryBase, -0.2), // Darker shade
    changeLightness(primaryComp, 0.2), // Complementary light tint
    changeLightness(primaryComp, 0.1), // Complementary softer tint
    primaryComp, // Complementary Base
    changeLightness(primaryComp, -0.1), // Complementary shade
    changeLightness(primaryComp, -0.2), // Complementary darker shade
  ];
  
  return [...new Set(finalPalette)].slice(0, MAX_COLORS);
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
