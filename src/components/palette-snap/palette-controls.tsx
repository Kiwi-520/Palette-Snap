"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Minus, Download, Copy } from "lucide-react";
import type { Palette } from "@/app/page";
import type { ColorHistogram } from "@/lib/color-quantizer";
import { Skeleton } from "../ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "../ui/dropdown-menu";
import { cn } from "@/lib/utils";

interface PaletteControlsProps {
    palette: Palette;
    setPalette: (palette: Palette) => void;
    histogram: ColorHistogram | null;
    isLoading: boolean;
}

export function PaletteControls({ palette, setPalette, histogram, isLoading }: PaletteControlsProps) {
    const { toast } = useToast();

    const addColor = () => {
        if (histogram && palette.length < histogram.length && palette.length < 20) {
            const nextColor = histogram[palette.length].hex;
            setPalette([...palette, nextColor]);
        }
    };

    const removeColor = () => {
        if (palette.length > 2) {
            setPalette(palette.slice(0, -1));
        }
    };

    const copyToClipboard = (text: string, format: string) => {
        navigator.clipboard.writeText(text);
        toast({ title: `Copied ${format} to clipboard!` });
    };

    const downloadPalette = () => {
        const canvas = document.createElement('canvas');
        const canvasContext = canvas.getContext('2d');
        if (!canvasContext) return;

        const colorHeight = 100;
        const colorWidth = 100;
        canvas.width = palette.length * colorWidth;
        canvas.height = colorHeight;

        palette.forEach((color, index) => {
            canvasContext.fillStyle = color;
            canvasContext.fillRect(index * colorWidth, 0, colorWidth, colorHeight);
        });

        const link = document.createElement('a');
        link.download = 'palette.png';
        link.href = canvas.toDataURL('image/png');
        link.click();
    }

    const formatCss = () => {
        return ":root {\n" + palette.map((color, i) => `  --color-${i+1}: ${color};`).join('\n') + "\n}";
    }

    const formatScss = () => {
        return palette.map((color, i) => `$color-${i+1}: ${color};`).join('\n');
    }

    const isAddDisabled = isLoading || !histogram || palette.length >= Math.min(20, histogram.length);
    const isRemoveDisabled = isLoading || palette.length <= 2;


    if (isLoading) {
        return (
             <Card>
                <CardHeader>
                    <CardTitle className="font-belleza">Image Palette</CardTitle>
                </CardHeader>
                <CardContent className="flex items-center gap-2 pt-2">
                    <Skeleton className="h-10 w-20" />
                    <Skeleton className="h-10 flex-grow" />
                    <Skeleton className="h-10 w-20" />
                </CardContent>
            </Card>
        )
    }

    if (!histogram || histogram.length === 0) {
        return null;
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="font-belleza">Image Palette</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col md:flex-row items-center gap-4 pt-2">
                <div className="flex border rounded-md">
                    <Button variant="ghost" size="icon" onClick={addColor} className="rounded-r-none border-r" title="Add color" disabled={isAddDisabled}>
                        <Plus className="w-4 h-4"/>
                    </Button>
                    <Button variant="ghost" size="icon" onClick={removeColor} className="rounded-l-none" title="Remove color" disabled={isRemoveDisabled}>
                        <Minus className="w-4 h-4"/>
                    </Button>
                </div>
                <div className="flex-grow grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-10 gap-1 w-full">
                    {palette.map((color, index) => (
                        <div 
                            key={index} 
                            className={cn("h-10 rounded-md w-full cursor-pointer transition-transform hover:scale-110")}
                            style={{ backgroundColor: color }}
                            onClick={() => copyToClipboard(color, color)}
                            title={`Copy ${color}`}
                        />
                    ))}
                    {Array.from({ length: 10 - palette.length }).map((_, index) => (
                      <div key={index} className={cn("h-10 rounded-md w-full bg-muted/50", { 'hidden sm:block': palette.length > 5 && index < 5 } )} />
                    ))}
                </div>
                <div className="flex border rounded-md">
                     <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="rounded-r-none border-r" title="Copy formats">
                                <Copy className="w-4 h-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                            <DropdownMenuItem onClick={() => copyToClipboard(formatCss(), 'CSS Variables')}>Copy as CSS</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => copyToClipboard(formatScss(), 'SCSS Variables')}>Copy as SCSS</DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                    <Button variant="ghost" size="icon" onClick={downloadPalette} className="rounded-l-none" title="Download as PNG">
                        <Download className="w-4 h-4" />
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
