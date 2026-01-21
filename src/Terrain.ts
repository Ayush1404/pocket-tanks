import { GameConfig } from './constants';

export class Terrain {
    public width: number;
    public height: number;
    public pixels: Uint8Array; // 1 for solid, 0 for air
    public isSettling: boolean = false;

    constructor(width: number, height: number) {
        this.width = width;
        this.height = height;
        this.pixels = new Uint8Array(width * height);
        this.generate();
    }

    private generate(): void {
        const seed = Math.random() * 100;
        for (let x = 0; x < this.width; x++) {
            // Hill algorithm
            const h = GameConfig.BASE_HEIGHT + Math.sin(x * 0.01 + seed) * 60 + Math.sin(x * 0.02) * 20;
            for (let y = 0; y < this.height; y++) {
                if (y > h) {
                    this.pixels[y * this.width + x] = 1;
                }
            }
        }
    }

    public isSolid(x: number, y: number): boolean {
        const tx = Math.floor(x);
        const ty = Math.floor(y);
        if (tx < 0 || tx >= this.width || ty < 0 || ty >= this.height) return false;
        return this.pixels[ty * this.width + tx] === 1;
    }

    public carve(impactX: number, impactY: number, radius: number): void {
        const r2 = radius * radius;
        const ix = Math.floor(impactX);
        const iy = Math.floor(impactY);

        for (let y = -radius; y <= radius; y++) {
            for (let x = -radius; x <= radius; x++) {
                if (x * x + y * y <= r2) {
                    const tx = ix + x;
                    const ty = iy + y;
                    if (tx >= 0 && tx < this.width && ty >= 0 && ty < this.height) {
                        this.pixels[ty * this.width + tx] = 0;
                    }
                }
            }
        }
        this.isSettling = true;
    }

    public updateSettling(): boolean {
        let movedAny = false;
        // Scan bottom-to-top so pixels fall into voids
        for (let y = this.height - 2; y >= 0; y--) {
            for (let x = 0; x < this.width; x++) {
                const idx = y * this.width + x;
                const belowIdx = (y + 1) * this.width + x;

                if (this.pixels[idx] === 1 && this.pixels[belowIdx] === 0) {
                    this.pixels[belowIdx] = 1;
                    this.pixels[idx] = 0;
                    movedAny = true;
                }
            }
        }
        this.isSettling = movedAny;
        return movedAny;
    }
}