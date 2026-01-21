import Phaser from 'phaser';
import { GameConfig } from './constants';
import { Terrain } from './Terrain';

export class Projectile extends Phaser.Physics.Arcade.Sprite {
    private onHit: (x: number, y: number, radius: number) => void;
    private terrain: Terrain;
    private explosionRadius: number;

    constructor(
        scene: Phaser.Scene, 
        x: number, y: number, 
        velocityX: number, velocityY: number, 
        radius: number,
        terrain: Terrain, 
        onHit: (x: number, y: number, radius: number) => void
    ) {
        super(scene, x, y, 'bullet'); 

        this.explosionRadius = radius;
        this.terrain = terrain;
        this.onHit = onHit;

        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.setVelocity(velocityX, velocityY);
        this.setGravityY(GameConfig.GRAVITY);
        this.setAccelerationX(GameConfig.WIND); 
    }

    update() {
        // Pixel-perfect check against 2D grid
        if (this.terrain.isSolid(this.x, this.y)) {
            this.onHit(this.x, this.y, this.explosionRadius);
            this.destroy();
            return;
        }

        // Out of bounds check
        if (this.x < 0 || this.x > GameConfig.WIDTH || this.y > GameConfig.HEIGHT) {
            this.destroy();
        }
    }
}