"use client";

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { db } from '@/lib/firebase';
import { collection, query, where, onSnapshot, orderBy, deleteDoc, doc } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import Image from 'next/image';
import { Button } from '../ui/button';
import { Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface SavedPalette {
  id: string;
  colors: string[];
  image: string;
  createdAt: any;
}

export function SavedPalettes() {
  const { user } = useAuth();
  const [palettes, setPalettes] = useState<SavedPalette[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      setLoading(true);
      const q = query(collection(db, "palettes"), where("userId", "==", user.uid), orderBy("createdAt", "desc"));
      
      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const userPalettes: SavedPalette[] = [];
        querySnapshot.forEach((doc) => {
          userPalettes.push({ id: doc.id, ...doc.data() } as SavedPalette);
        });
        setPalettes(userPalettes);
        setLoading(false);
      }, (error) => {
        console.error("Error fetching palettes: ", error);
        setLoading(false);
      });

      return () => unsubscribe();
    } else {
      setPalettes([]);
      setLoading(false);
    }
  }, [user]);

  const deletePalette = async (id: string) => {
    try {
        await deleteDoc(doc(db, "palettes", id));
        toast({
            title: "Palette Deleted",
            description: "The palette has been removed.",
        })
    } catch (error) {
        console.error("Error deleting palette:", error);
        toast({
            variant: "destructive",
            title: "Error Deleting",
            description: "Could not delete the palette.",
        })
    }
  }

  if (!user) {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="font-belleza">Saved Palettes</CardTitle>
            </CardHeader>
            <CardContent>
                <p className='text-sm text-muted-foreground font-alegreya text-center'>Please sign in to view your saved palettes.</p>
            </CardContent>
        </Card>
    );
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-belleza">Saved Palettes</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading && (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}
          </div>
        )}
        {!loading && palettes.length === 0 && (
          <p className='text-sm text-muted-foreground font-alegreya text-center'>You haven't saved any palettes yet.</p>
        )}
        {!loading && palettes.map((p) => (
          <div key={p.id} className="flex items-center gap-4 group">
            <div className="relative w-16 h-16 rounded-md overflow-hidden border">
                {p.image ? <Image src={p.image} alt="Palette source" fill className="object-cover" /> : <div className="w-full h-full bg-muted" />}
            </div>
            <div className="flex-grow flex gap-1">
              {p.colors.map((color, i) => (
                <div key={i} style={{ backgroundColor: color }} className="h-10 flex-1 rounded-sm first:rounded-l-md last:rounded-r-md" />
              ))}
            </div>
            <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100" onClick={() => deletePalette(p.id)}>
                <Trash2 className="w-4 h-4 text-destructive"/>
            </Button>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
