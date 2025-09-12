export function Footer() {
  return (
    <footer className="border-t bg-background">
      <div className="container mx-auto flex h-24 items-center justify-between px-4 sm:px-6 lg:px-8">
        <span className="font-bold font-belleza text-lg">Palette Snap</span>
        <div className="text-center text-sm text-muted-foreground font-alegreya">
            <p>&copy; {new Date().getFullYear()} Palette Snap. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
