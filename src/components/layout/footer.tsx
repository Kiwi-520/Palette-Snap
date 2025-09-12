
export function Footer() {
  return (
    <footer className="border-t bg-background">
      <div className="container mx-auto flex h-24 items-center justify-between px-4 sm:px-6 lg:px-8">
        <a className="flex items-center space-x-2" href="/">
            <span className="font-bold">Palette Snap</span>
        </a>
        <div className="text-center text-sm text-muted-foreground">
            <p>&copy; {new Date().getFullYear()} Palette Snap. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
