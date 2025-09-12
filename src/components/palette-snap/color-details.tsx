"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Copy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getClosestColorName, hexToCmyk, hexToHsl, hexToRgbString as hexToRgb } from "@/lib/color-names";
import { Skeleton } from "../ui/skeleton";

interface ColorDetailsProps {
    pickerState: { x: number; y: number; color: string; } | null;
}

function ColorInfoRow({ label, value, onCopy }: { label: string; value: string; onCopy: (value: string) => void }) {
    return (
        <div className="flex items-center justify-between font-mono text-sm">
            <div className="flex items-center gap-4">
                <span className="text-muted-foreground w-12">{label}:</span>
                <span className="text-foreground truncate">{value}</span>
            </div>
            <Button variant="ghost" size="icon" onClick={() => onCopy(value)}>
                <Copy className="w-4 h-4" />
            </Button>
        </div>
    );
}

export function ColorDetails({ pickerState }: ColorDetailsProps) {
    const { toast } = useToast();

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        toast({ title: `Copied ${text} to clipboard!` });
    };
    
    const color = pickerState?.color;
    
    const renderContent = () => {
        if (!color) {
            return (
                <div className="flex items-center justify-center text-muted-foreground font-alegreya h-48">
                    <p>Hover over the image to pick a color.</p>
                </div>
            )
        }

        const colorName = getClosestColorName(color);
        const rgb = hexToRgb(color);
        const hsl = hexToHsl(color);
        const cmyk = hexToCmyk(color);

        return (
            <div className="space-y-4">
                <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-lg border-2" style={{ backgroundColor: color }} />
                    <div>
                        <p className="text-xl font-bold font-belleza">{colorName}</p>
                        <p className="font-mono text-muted-foreground">{color}</p>
                    </div>
                </div>
                <div className="space-y-2">
                    <ColorInfoRow label="RGB" value={rgb} onCopy={copyToClipboard} />
                    <ColorInfoRow label="HSL" value={hsl} onCopy={copyToClipboard} />
                    <ColorInfoRow label="CMYK" value={cmyk} onCopy={copyToClipboard} />
                </div>
            </div>
        )
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-base font-semibold font-belleza">Color Details</CardTitle>
            </CardHeader>
            <CardContent>
                {renderContent()}
            </CardContent>
        </Card>
    );
}
