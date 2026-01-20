import Phaser from 'phaser';
import { GameConfig } from './constants';
import { Terrain } from './Terrain';

class GameScene extends Phaser.Scene {
    private terrain!: Terrain;
    private terrainGraphics!: Phaser.GameObjects.Graphics;
    private skyGraphics!: Phaser.GameObjects.Graphics;

    constructor() {
        super('GameScene');
    }

    create(): void {
        // 1. Draw Sky Gradient (Black to Purple)
        this.skyGraphics = this.add.graphics();
        this.drawSky();

        // 2. Initialize Terrain Data
        this.terrain = new Terrain(GameConfig.WIDTH);

        // 3. Initialize Terrain Renderer
        this.terrainGraphics = this.add.graphics();
        
        // 4. Initial Draw
        this.drawTerrain();
    }

    private drawSky(): void {
        // Define the gradient colors for the 4 corners
        // fillGradientStyle(topLeft, topRight, bottomLeft, bottomRight, alpha)
        this.skyGraphics.fillGradientStyle(
            GameConfig.SKY_TOP,    // Top Left
            GameConfig.SKY_TOP,    // Top Right
            GameConfig.SKY_BOTTOM, // Bottom Left
            GameConfig.SKY_BOTTOM, // Bottom Right
            1                      // Alpha
        );

        // Draw the rectangle that will use the gradient style defined above
        this.skyGraphics.fillRect(0, 0, GameConfig.WIDTH, GameConfig.HEIGHT);
    }

    private drawTerrain(): void {
        this.terrainGraphics.clear();
        this.terrainGraphics.fillStyle(GameConfig.TERRAIN_COLOR, 1);

        this.terrainGraphics.beginPath();
        this.terrainGraphics.moveTo(0, GameConfig.HEIGHT);

        for (let x = 0; x < this.terrain.heights.length; x++) {
            this.terrainGraphics.lineTo(x, this.terrain.heights[x]);
        }

        this.terrainGraphics.lineTo(GameConfig.WIDTH, GameConfig.HEIGHT);
        this.terrainGraphics.closePath();
        this.terrainGraphics.fillPath();
    }
}

const config: Phaser.Types.Core.GameConfig = {
    type: Phaser.AUTO,
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        width: GameConfig.WIDTH,
        height: GameConfig.HEIGHT,
    },
    scene: GameScene,
};

new Phaser.Game(config);