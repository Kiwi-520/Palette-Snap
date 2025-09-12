"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Minus, Download, Save } from "lucide-react";
import type { Palette } from "@/app/page";
import type { ColorHistogram } from "@/lib/color-quantizer";
import { Skeleton } from "../ui/skeleton";
import { useToast } from "@/hooks/use-toast";

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

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        toast({ title: `Copied ${text} to clipboard!` });
    };

    if (isLoading) {
        return (
             <Card>
                <CardHeader>
                    <CardTitle className="text-base font-semibold">PALETTE</CardTitle>
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
                <CardTitle className="text-base font-semibold">PALETTE</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center gap-2 pt-2">
                <div className="flex border rounded-md">
                    <Button variant="ghost" size="icon" onClick={addColor} className="rounded-r-none border-r">
                        <Plus className="w-4 h-4"/>
                    </Button>
                    <Button variant="ghost" size="icon" onClick={removeColor} className="rounded-l-none">
                        <Minus className="w-4 h-4"/>
                    </Button>
                </div>
                <div className="flex-grow grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 lg:grid-cols-10 gap-1">
                    {palette.map((color, index) => (
                        <div 
                            key={index} 
                            className="h-10 rounded-md w-full cursor-pointer" 
                            style={{ backgroundColor: color }}
                            onClick={() => copyToClipboard(color)}
                            title={`Copy ${color}`}
                        />
                    ))}
                </div>
                <div className="flex border rounded-md">
                    <Button variant="ghost" size="icon" className="rounded-r-none border-r">
                        <Download className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="rounded-l-none">
                        <Save className="w-4 h-4" />
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
