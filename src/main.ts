import Phaser from 'phaser';
import { GameConfig } from './constants';
import { Terrain } from './Terrain';
import { Projectile } from './Projectile';
import { Tank } from './Tank';

class GameScene extends Phaser.Scene {
    private terrain!: Terrain;
    private skyGraphics!: Phaser.GameObjects.Graphics;
    private projectiles!: Phaser.GameObjects.Group;
    private terrainTexture!: Phaser.Textures.CanvasTexture;
    private terrainImage!: Phaser.GameObjects.Image;
    private explosionEmitter!: Phaser.GameObjects.Particles.ParticleEmitter;
    private tank!: Tank;

    constructor() {
        super('GameScene');
    }

    create(): void {
        this.skyGraphics = this.add.graphics();
        this.drawSky();

        this.terrain = new Terrain(GameConfig.WIDTH, GameConfig.HEIGHT);

        // Setup 2D Pixel Renderer
        this.terrainTexture = this.textures.createCanvas('terrainTexture', GameConfig.WIDTH, GameConfig.HEIGHT)!;
        this.terrainImage = this.add.image(0, 0, 'terrainTexture').setOrigin(0);
        this.updateTerrainDisplay();

        // Generate Bullet Texture
        const graphics = this.make.graphics({ x: 0, y: 0 }, false);
        graphics.fillStyle(0xffffff, 1);
        graphics.fillCircle(4, 4, 4);
        graphics.generateTexture('bullet', 8, 8);
        graphics.destroy(); // Clean up the temp graphics object

        // Generate Debris Particle Texture
        const debrisGraphics = this.make.graphics({ x: 0, y: 0 }, false);
        debrisGraphics.fillStyle(GameConfig.TERRAIN_COLOR, 1);
        debrisGraphics.fillRect(0, 0, 2, 2);
        debrisGraphics.generateTexture('debris', 2, 2);
        debrisGraphics.destroy();

        // Setup particle emitter
        this.explosionEmitter = this.add.particles(0, 0, 'debris', {
            speed: { min: 50, max: 200 },
            scale: { start: 1, end: 0 },
            lifespan: 1000,
            gravityY: 300,
            alpha: { start: 1, end: 0 },
        });
        this.explosionEmitter.stop();

        this.projectiles = this.add.group({ classType: Projectile, runChildUpdate: true });

        // Create tank
        this.tank = new Tank(this, 200, 300, this.terrain);

        this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
            const radius = pointer.event.shiftKey ? 60 : GameConfig.EXPLOSION_RADIUS;
            const turretTip = this.tank.getTurretTip();

            // Calculate velocity vector based on turret tip position relative to tank center
            // This gives us the actual direction the turret is visually pointing
            const directionX = turretTip.x - this.tank.x;
            const directionY = turretTip.y - this.tank.y;

            // Normalize and scale to projectile speed
            const length = Math.sqrt(directionX * directionX + directionY * directionY);
            const speed = 500;
            const vX = (directionX / length) * speed;
            const vY = (directionY / length) * speed;

            const p = new Projectile(this, turretTip.x, turretTip.y, vX, vY, radius, this.terrain,
                (x, y, r) => this.handleExplosion(x, y, r)
            );
            this.projectiles.add(p);
        });
    }

    update(): void {
        // Update tank
        this.tank.update();

        if (this.terrain.isSettling) {
            this.terrain.updateSettling();
            this.updateTerrainDisplay();
        }
    }

    private updateTerrainDisplay(): void {
        const ctx = this.terrainTexture.context;
        const imgData = ctx.createImageData(GameConfig.WIDTH, GameConfig.HEIGHT);
        
        // Use IntegerToColor to get a Phaser Color object
        const color = Phaser.Display.Color.IntegerToColor(GameConfig.TERRAIN_COLOR);

        for (let i = 0; i < this.terrain.pixels.length; i++) {
            if (this.terrain.pixels[i] === 1) {
                const p = i * 4;
                imgData.data[p] = color.red;
                imgData.data[p + 1] = color.green;
                imgData.data[p + 2] = color.blue;
                imgData.data[p + 3] = 255;
            }
        }
        
        ctx.putImageData(imgData, 0, 0);
        this.terrainTexture.refresh();
    }

    private drawSky(): void {
        this.skyGraphics.fillGradientStyle(
            GameConfig.SKY_TOP, GameConfig.SKY_TOP,
            GameConfig.SKY_BOTTOM, GameConfig.SKY_BOTTOM, 1
        );
        this.skyGraphics.fillRect(0, 0, GameConfig.WIDTH, GameConfig.HEIGHT);
    }

    private handleExplosion(x: number, y: number, radius: number): void {
        // Award score to tank based on proximity (damage-to-score conversion)
        this.tank.addScore(x, y, radius);

        // Trigger VFX before carving
        this.playExplosionVFX(x, y, radius);

        // Carve terrain
        this.terrain.carve(x, y, radius);

        // Delay settling to create shockwave pause
        this.time.delayedCall(150, () => {
            this.terrain.isSettling = true;
        });
    }

    private playExplosionVFX(x: number, y: number, radius: number): void {
        // Sprite Animation: Simple scaling explosion sprite
        const explosionSprite = this.add.sprite(x, y, 'bullet');
        explosionSprite.setScale(0);
        explosionSprite.setTint(0xffff00); // Yellow explosion
        this.tweens.add({
            targets: explosionSprite,
            scale: radius / 10,
            alpha: 0,
            duration: 200,
            onComplete: () => explosionSprite.destroy()
        });

        // Screen Shake: Intensity tied to weapon radius
        const shakeIntensity = radius / 40;
        this.cameras.main.shake(200, shakeIntensity * 0.01);

        // Particle Emitter: Debris particles flying outward
        this.explosionEmitter.setPosition(x, y);
        this.explosionEmitter.explode(20);

        // Impact Sound Hook
        this.playExplosionSound();
    }

    private playExplosionSound(): void {
        // Placeholder for sound trigger
        console.log('Explosion sound played');
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
    physics: { default: 'arcade', arcade: { debug: false } },
    scene: GameScene,
};

new Phaser.Game(config);
