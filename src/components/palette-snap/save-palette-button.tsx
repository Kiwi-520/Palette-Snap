"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Save, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import type { Palette } from "@/app/page";

interface SavePaletteButtonProps {
  palette: Palette;
  image: string | null;
}

export function SavePaletteButton({ palette, image }: SavePaletteButtonProps) {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSave = async () => {
    if (!user) {
      toast({
        variant: "destructive",
        title: "Not signed in",
        description: "You must be signed in to save a palette.",
      });
      return;
    }

    if (palette.length === 0) {
      toast({
        variant: "destructive",
        title: "Empty Palette",
        description: "Cannot save an empty palette.",
      });
      return;
    }

    setIsLoading(true);
    try {
      await addDoc(collection(db, "palettes"), {
        userId: user.uid,
        colors: palette,
        image: image,
        createdAt: serverTimestamp(),
      });
      toast({
        title: "Palette Saved!",
        description: "Your palette has been successfully saved.",
      });
    } catch (error) {
      console.error("Error saving palette: ", error);
      toast({
        variant: "destructive",
        title: "Error Saving Palette",
        description: "There was a problem saving your palette. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) {
    return null;
  }

  return (
    <Button onClick={handleSave} disabled={isLoading || palette.length === 0}>
      {isLoading ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <Save className="mr-2 h-4 w-4" />
      )}
      Save Palette
    </Button>
  );
}
