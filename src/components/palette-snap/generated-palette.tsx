'use client';

import { Loader2, Save, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import type { Palette } from '@/app/page';

// --- Sub-component for displaying the palette ---
function PaletteDisplay({ palette, onSave, onShare }: { palette: Palette; onSave: () => void; onShare: (palette: Palette) => void }) {
  const { toast } = useToast();

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: `Copied ${text} to clipboard!` });
  };
  
  return (
    <div className="w-full">
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
        {palette.map((color, index) => (
          <div key={index} className="flex flex-col items-center gap-2 group">
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
      <div className="flex justify-center gap-4 mt-8">
        <Button onClick={onSave} className="font-headline"><Save className="mr-2" /> Save Palette</Button>
        <Button variant="outline" onClick={() => onShare(palette)} className="font-headline"><Share2 className="mr-2" /> Share</Button>
      </div>
    </div>
  );
}

// --- Main component for the results section ---
interface GeneratedPaletteProps {
    isLoading: boolean;
    palette: Palette | null;
    onSave: () => void;
}

export function GeneratedPalette({ isLoading, palette, onSave }: GeneratedPaletteProps) {
    const { toast } = useToast();
    
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

    return (
        <section className="mt-12">
            <h2 className="font-headline text-4xl text-center mb-6">Generated Palette</h2>
            <div className="w-full max-w-4xl mx-auto min-h-[12rem] bg-card p-6 rounded-lg shadow-lg border border-primary/10 flex items-center justify-center">
                {isLoading ? (
                    <div className="flex flex-col items-center gap-4 text-primary">
                        <Loader2 className="h-12 w-12 animate-spin" />
                        <p className="font-headline text-lg opacity-80">Generating your palette...</p>
                    </div>
                ) : palette ? (
                    <PaletteDisplay palette={palette} onSave={onSave} onShare={sharePalette} />
                ) : (
                    <div className="text-center text-foreground/60">
                      <p className="font-headline text-xl">Your palette will appear here.</p>
                      <p className="font-body">Upload an image to get started.</p>
                    </div>
                )}
            </div>
        </section>
    );
}
