'use client';

import { Share2, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import type { Palette } from '@/app/page';

interface SavedPalettesProps {
  savedPalettes: Palette[];
  onRemove: (index: number) => void;
}

export function SavedPalettes({ savedPalettes, onRemove }: SavedPalettesProps) {
  const { toast } = useToast();

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: `Copied ${text} to clipboard!` });
  };
  
  const sharePalette = async (paletteToShare: Palette) => {
    const shareText = `Check out this color palette I generated with Palette Snap!\n${paletteToShare.join(', ')}`;
    try {
        if (navigator.share) {
            await navigator.share({
                title: 'My Palette Snap Palette',
                text: shareText,
            });
        } else {
            navigator.clipboard.writeText(shareText);
            toast({ title: 'Sharing not supported', description: 'Palette info copied to clipboard.' });
        }
    } catch (error) {
        console.error('Error sharing:', error);
        toast({ title: 'Could not share palette', variant: 'destructive' });
    }
  };

  if (savedPalettes.length === 0) {
    return null;
  }
  
  return (
    <section className="mt-16">
      <h2 className="font-headline text-4xl text-center mb-6">Saved Palettes</h2>
      <div className="grid gap-8 max-w-6xl mx-auto">
        {savedPalettes.map((savedPalette, pIndex) => (
          <Card key={pIndex} className="shadow-lg border-primary/5 bg-card">
            <CardContent className="p-6">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
                {savedPalette.map((color, cIndex) => (
                   <div key={cIndex} className="flex flex-col items-center gap-2 group">
                        <div 
                            className="w-full aspect-square rounded-lg shadow-md cursor-pointer transition-transform duration-200 group-hover:scale-105" 
                            style={{ backgroundColor: color }}
                            onClick={() => copyToClipboard(color)}
                            title={`Click to copy ${color}`}
                        />
                        <p className="font-code text-sm text-foreground/70 tracking-wider">{color}</p>
                    </div>
                ))}
              </div>
              <div className="flex justify-end gap-2 mt-4">
                  <Button aria-label="Share this palette" variant="ghost" size="icon" onClick={() => sharePalette(savedPalette)}><Share2 className="w-4 h-4" /></Button>
                  <Button aria-label="Delete this palette" variant="ghost" size="icon" onClick={() => onRemove(pIndex)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
