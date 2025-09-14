import { Palette } from "lucide-react";
import { ThemeToggle } from "./theme-toggle";
import { AuthButton } from "./auth-button";

export function Navbar() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center">
        <div className="mr-4 flex items-center">
          <a className="mr-6 flex items-center space-x-2" href="/">
            <Palette className="h-7 w-7 text-primary" />
            <span className="font-bold text-xl font-belleza">Palette Snap</span>
          </a>
        </div>
        <div className="flex flex-1 items-center justify-end space-x-2">
            <AuthButton />
            <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
