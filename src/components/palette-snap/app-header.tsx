import { Palette } from 'lucide-react';

export function AppHeader() {
  return (
    <header className="py-8 px-4 sm:px-8 text-center">
      <h1 className="font-headline text-5xl md:text-7xl font-bold text-primary flex items-center justify-center gap-3">
        <Palette className="w-12 h-12" /> Palette Snap
      </h1>
      <p className="mt-4 text-lg md:text-xl text-foreground/80 font-body">
        Capture colors from any image.
      </p>
    </header>
  );
}
