declare module 'quantize' {
    function quantize(pixels: number[][], colorCount: number): ColorMap;
    export = quantize;

    interface ColorMap {
        palette(): number[][];
        map(pixel: number[]): number[];
        nearest(pixel: number[]): number[];
        size(): number;
    }
}
