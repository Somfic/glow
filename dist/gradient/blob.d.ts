export interface Blob {
    x: number;
    y: number;
    baseX: number;
    baseY: number;
    radius: number;
    baseRadius: number;
    color: string;
    speed: number;
    phaseX: number;
    phaseY: number;
    orbitRadius: number;
}
export declare function createBlob(width: number, height: number, color: string): Blob;
export declare function updateBlob(blob: Blob, time: number, width: number, height: number): Blob;
export declare function drawBlob(ctx: CanvasRenderingContext2D, blob: Blob, opacity: number): void;
