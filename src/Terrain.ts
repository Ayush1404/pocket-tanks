import { GameConfig } from "./constants";

export class Terrain {
    public heights: Float32Array;
    private width: number;

    constructor(width: number) {
        this.width = width;
        this.heights = new Float32Array(width);
        this.generate();
    }

    private generate(): void {
        const seed1 = Math.random() * 100;
        const seed2 = Math.random() * 100;

        for (let x = 0; x < this.width; x++) {
            // Multi-octave sine wave summation
            const h1 = Math.sin(x * 0.01 + seed1) * 50;
            const h2 = Math.sin(x * 0.02 + seed2) * 20;
            const h3 = Math.sin(x * 0.005) * 80;
            
            this.heights[x] = GameConfig.BASE_HEIGHT + h1 + h2 + h3;
        }
    }

    public getY(x: number): number {
        const roundedX = Math.round(x);
        if (roundedX < 0 || roundedX >= this.width) return 9999;
        return this.heights[roundedX];
    }
}