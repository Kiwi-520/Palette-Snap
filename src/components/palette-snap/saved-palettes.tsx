"use client";

import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Palette, SavedPalette } from "@/app/page";
import { Trash2, CheckSquare } from "lucide-react";
import { DialogClose } from "@radix-ui/react-dialog";

interface SavedPalettesProps {
  savedPalettes: SavedPalette[];
  setSavedPalettes: (palettes: SavedPalette[]) => void;
  setPalette: (palette: Palette) => void;
}

export function SavedPalettes({ savedPalettes, setSavedPalettes, setPalette }: SavedPalettesProps) {
  const { toast } = useToast();

  const deletePalette = (id: string) => {
    const updatedPalettes = savedPalettes.filter(p => p.id !== id);
    setSavedPalettes(updatedPalettes);
    toast({
      title: "Palette Deleted",
      description: "The palette has been removed from your library.",
    });
  };

  const applyPalette = (colors: Palette) => {
    setPalette(colors);
    toast({
      title: "Palette Applied",
      description: "The selected palette is now active.",
    });
  };

  if (savedPalettes.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-8 font-alegreya">
        <p>You haven't saved any palettes yet.</p>
        <p className="text-sm">Use the "Save" icon on a generated palette to add it here.</p>
      </div>
    );
  }

  return (
    <div className="max-h-[60vh] overflow-y-auto space-y-4 -mr-6 pr-6">
      {savedPalettes.map(p => (
        <div key={p.id} className="border p-4 rounded-lg">
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-semibold font-belleza">{p.name}</h3>
            <div className="flex gap-1">
              <DialogClose asChild>
                <Button variant="ghost" size="icon" onClick={() => applyPalette(p.colors)} title="Apply this palette">
                    <CheckSquare className="w-5 h-5 text-green-500" />
                </Button>
              </DialogClose>
              <Button variant="ghost" size="icon" onClick={() => deletePalette(p.id)} title="Delete this palette">
                <Trash2 className="w-5 h-5 text-destructive" />
              </Button>
            </div>
          </div>
          <div className="flex gap-1">
            {p.colors.map((color, index) => (
              <div key={index} className="h-8 flex-1 rounded" style={{ backgroundColor: color }} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
