"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Minus, Download, Save, Copy } from "lucide-react";
import type { Palette } from "@/app/page";
import type { ColorHistogram } from "@/lib/color-quantizer";
import { Skeleton } from "../ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "../ui/dropdown-menu";

interface PaletteControlsProps {
    palette: Palette;
    setPalette: (palette: Palette) => void;
    histogram: ColorHistogram | null;
    isLoading: boolean;
    onSave: () => void;
}

export function PaletteControls({ palette, setPalette, histogram, isLoading, onSave }: PaletteControlsProps) {
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
        return palette.map((color, i) => `--color-${i+1}: ${color};`).join('\n');
    }

    const formatScss = () => {
        return palette.map((color, i) => `$color-${i+1}: ${color};`).join('\n');
    }

    if (isLoading) {
        return (
             <Card>
                <CardHeader>
                    <CardTitle className="font-belleza">Palette</CardTitle>
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
                <CardTitle className="font-belleza">Palette</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col md:flex-row items-center gap-4 pt-2">
                <div className="flex border rounded-md">
                    <Button variant="ghost" size="icon" onClick={addColor} className="rounded-r-none border-r" title="Add color">
                        <Plus className="w-4 h-4"/>
                    </Button>
                    <Button variant="ghost" size="icon" onClick={removeColor} className="rounded-l-none" title="Remove color">
                        <Minus className="w-4 h-4"/>
                    </Button>
                </div>
                <div className="flex-grow grid grid-cols-5 sm:grid-cols-10 md:grid-cols-10 lg:grid-cols-10 gap-1 w-full">
                    {palette.map((color, index) => (
                        <div 
                            key={index} 
                            className="h-10 rounded-md w-full cursor-pointer transition-transform hover:scale-110" 
                            style={{ backgroundColor: color }}
                            onClick={() => copyToClipboard(color, color)}
                            title={`Copy ${color}`}
                        />
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
                    <Button variant="ghost" size="icon" onClick={downloadPalette} className="rounded-none border-r" title="Download as PNG">
                        <Download className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={onSave} className="rounded-l-none" title="Save palette">
                        <Save className="w-4 h-4" />
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
