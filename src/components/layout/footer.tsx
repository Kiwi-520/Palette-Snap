import { Palette } from "lucide-react";

const footerLinks = [
    {
      title: "Product",
      links: ["Features", "Pricing", "Enterprise", "Case studies"],
    },
    {
      title: "Company",
      links: ["About", "Careers", "Contact", "Blog"],
    },
    {
      title: "Resources",
      links: ["Help center", "API docs", "Community", "Tutorials"],
    },
    {
      title: "Legal",
      links: ["Privacy policy", "Terms of service", "Cookie policy"],
    },
];

export function Footer() {
  return (
    <footer className="border-t bg-background">
      <div className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4 lg:grid-cols-5">
            <div className="col-span-full mb-4 lg:col-span-1">
                <a className="flex items-center space-x-2" href="/">
                    <Palette className="h-6 w-6 text-primary" />
                    <span className="font-bold">Palette Snap</span>
                </a>
                <p className="mt-4 text-sm text-muted-foreground">
                    Generate beautiful color palettes from your images with a snap.
                </p>
            </div>

            {footerLinks.map((section) => (
                <div key={section.title}>
                    <h3 className="font-semibold">{section.title}</h3>
                    <ul className="mt-4 space-y-2">
                    {section.links.map((link) => (
                        <li key={link}>
                        <a href="#" className="text-sm text-muted-foreground hover:text-foreground">
                            {link}
                        </a>
                        </li>
                    ))}
                    </ul>
                </div>
            ))}
        </div>

        <div className="mt-8 border-t pt-8 text-center text-sm text-muted-foreground">
            <p>&copy; {new Date().getFullYear()} Palette Snap. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
