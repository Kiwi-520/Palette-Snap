"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Copy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ColorDisplayProps {
    pickerState: { x: number; y: number; color: string; } | null;
}

function hexToRgb(hex: string): string {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!result) return "rgba(0,0,0,255)";
    const r = parseInt(result[1], 16);
    const g = parseInt(result[2], 16);
    const b = parseInt(result[3], 16);
    return `rgba(${r},${g},${b},255)`;
}

export function ColorDisplay({ pickerState }: ColorDisplayProps) {
    const { toast } = useToast();

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        toast({ title: `Copied ${text} to clipboard!` });
    };
    
    const color = pickerState?.color || '#FFFFFF';
    const rgbColor = hexToRgb(color);

    return (
        <Card>
            <CardHeader>
                <div className="flex justify-between items-center">
                    <CardTitle className="text-base font-semibold">Colors</CardTitle>
                    <div className="flex items-center gap-1">
                        <span className="w-3 h-3 rounded-full bg-red-500"></span>
                        <span className="w-3 h-3 rounded-full bg-yellow-500"></span>
                        <span className="w-3 h-3 rounded-full bg-green-500"></span>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-4 pt-2">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-md border" style={{ backgroundColor: color }} />
                        <span className="font-mono text-sm">HEX: {color}</span>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => copyToClipboard(color)}>
                        <Copy className="w-4 h-4" />
                    </Button>
                </div>
                 <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-md border" style={{ backgroundColor: color }} />
                        <span className="font-mono text-sm">RGB: {rgbColor}</span>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => copyToClipboard(rgbColor)}>
                        <Copy className="w-4 h-4" />
                    </Button>
                </div>
                <Button variant="link" className="p-0 h-auto">Show more</Button>
            </CardContent>
        </Card>
    );
}
