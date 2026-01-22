import Phaser from 'phaser';
import { Terrain } from './Terrain';
import { TankConfig } from './constants';

export class Tank extends Phaser.GameObjects.Container {
    private chassis: Phaser.GameObjects.Sprite;
    private turret: Phaser.GameObjects.Sprite;
    private chassisKey: string;
    private turretKey: string;
    private terrain: Terrain;
    private moveCharges: number = TankConfig.INITIAL_MOVE_CHARGES;
    private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
    private totalScore: number = 0;
    private isMoving: boolean = false;
    private moveTargetX: number = 0;
    private moveDirection: number = 0;
    private absoluteTurretAngle: number = 0;

    constructor(scene: Phaser.Scene, x: number, y: number, terrain: Terrain, color: number = 0x00ff00) {
        super(scene, x, y);

        this.terrain = terrain;
        this.chassisKey = `chassis_${color.toString(16)}`;
        this.turretKey = `turret_${color.toString(16)}`;

        this.generateTextures(scene, color);

        // Create chassis sprite
        this.chassis = scene.add.sprite(0, 0, this.chassisKey);
        this.add(this.chassis);

        // Create turret sprite (positioned at the center-top of chassis)
        this.turret = scene.add.sprite(0, -3, this.turretKey);
        this.turret.setOrigin(0.5, 1); // Pivot at bottom center
        this.add(this.turret);

        scene.add.existing(this);

        // Setup keyboard controls
        this.cursors = scene.input.keyboard!.createCursorKeys();

        // Initialize turret angle (pointing right by default)
        this.setTurretAngle(0);

        // Snap to terrain initially
        this.snapToTerrain();
    }

    private generateTextures(scene: Phaser.Scene, color: number): void {
    const colorObj = Phaser.Display.Color.IntegerToColor(color);
    const r = colorObj.red;
    const g = colorObj.green;
    const b = colorObj.blue;

    // Adjusted color tiers
    const brightColor = Phaser.Display.Color.GetColor(Math.min(255, r + 80), Math.min(255, g + 80), Math.min(255, b + 80));
    // "Less dark" - changed multiplier from 0.4 to 0.7
    const mediumDarkColor = Phaser.Display.Color.GetColor(r * 0.7, g * 0.7, b * 0.7);

    if (!scene.textures.exists(this.chassisKey)) {
        const graphics = scene.make.graphics({ x: 0, y: 0 }, false);
        const centerX = 16;
        
        // --- 1. BOTTOM TRAPEZIUM (Upside Down, Medium Dark) ---
        const trackTopWidth = 28;
        const trackBottomWidth = 20;
        const trackHeight = 5;
        const trackY = 8;

        graphics.fillStyle(mediumDarkColor, 1);
        const trackPoints = [
            { x: centerX - trackTopWidth / 2, y: trackY },
            { x: centerX + trackTopWidth / 2, y: trackY },
            { x: centerX + trackBottomWidth / 2, y: trackY + trackHeight },
            { x: centerX - trackBottomWidth / 2, y: trackY + trackHeight }
        ];
        graphics.fillPoints(trackPoints, true);

        // --- 2. THE WHEELS (Small circles, same color as Upper Trapezium) ---
        graphics.fillStyle(brightColor, 1);
        const wheelY = trackY + (trackHeight / 2);
        const wheelRadius = 3; // Made smaller
        graphics.fillCircle(centerX - 9, wheelY, wheelRadius);
        graphics.fillCircle(centerX - 4.5, wheelY, wheelRadius);
        graphics.fillCircle(centerX, wheelY, wheelRadius);
        graphics.fillCircle(centerX + 4.5, wheelY, wheelRadius);
        graphics.fillCircle(centerX + 9, wheelY, wheelRadius);

        // --- 3. MIDDLE/UPPER TRAPEZIUM (Small, Bright) ---
        const hullBottomWidth = 16;
        const hullTopWidth = hullBottomWidth * 0.75; 
        const hullHeight = 4;
        const hullY = trackY - hullHeight;

        graphics.fillStyle(brightColor, 1);
        const hullPoints = [
            { x: centerX - hullTopWidth / 2, y: hullY },
            { x: centerX + hullTopWidth / 2, y: hullY },
            { x: centerX + hullBottomWidth / 2, y: hullY + hullHeight },
            { x: centerX - hullBottomWidth / 2, y: hullY + hullHeight }
        ];
        graphics.fillPoints(hullPoints, true);

        graphics.generateTexture(this.chassisKey, 32, 20);
        graphics.destroy();
    }

    // --- 4. TURRET (Needle Barrel) ---
    if (!scene.textures.exists(this.turretKey)) {
        const graphics = scene.make.graphics({ x: 0, y: 0 }, false);
        // Clean needle barrel
        graphics.fillStyle(0x333333, 1);
        graphics.fillRect(4, 0, 3, 12); 
        graphics.fillStyle(0xeeeeee, 1);
        graphics.fillRect(5, 0, 1, 12); 

        graphics.generateTexture(this.turretKey, 12, 12);
        graphics.destroy();
    }
}

    setTurretAngle(angle: number): void {
        // Store the absolute turret angle
        this.absoluteTurretAngle = angle;
        // Set visual rotation (compensate for chassis tilt)
        this.turret.setAngle(this.absoluteTurretAngle - this.chassis.angle);
    }

    getTurretAngle(): number {
        return this.absoluteTurretAngle;
    }

    getTurretTip(): { x: number, y: number } {
        // Calculate the tip position of the turret in world coordinates
        const localTip = new Phaser.Math.Vector2(0, -TankConfig.TURRET_LENGTH);
        localTip.rotate(Phaser.Math.DegToRad(this.turret.angle));

        return {
            x: this.x + localTip.x,
            y: this.y + localTip.y
        };
    }

    snapToTerrain(): void {
        // Two-point sampling: scan at x-TILT_SAMPLE_DISTANCE (back) and x+TILT_SAMPLE_DISTANCE (front)
        const rearX = Math.max(0, Math.floor(this.x - TankConfig.TILT_SAMPLE_DISTANCE));
        const frontX = Math.min(this.terrain.width - 1, Math.floor(this.x + TankConfig.TILT_SAMPLE_DISTANCE));

        // Find highest solid pixel at rear position
        let rearY = this.terrain.height;
        for (let y = 0; y < this.terrain.height; y++) {
            if (this.terrain.pixels[y * this.terrain.width + rearX] === 1) {
                rearY = y;
                break;
            }
        }

        // Find highest solid pixel at front position
        let frontY = this.terrain.height;
        for (let y = 0; y < this.terrain.height; y++) {
            if (this.terrain.pixels[y * this.terrain.width + frontX] === 1) {
                frontY = y;
                break;
            }
        }

        // Position tank at average of rear and front heights
        const averageY = (rearY + frontY) / 2;
        this.y = averageY - TankConfig.GROUND_OFFSET; // Offset by half chassis height

        // Calculate tilt angle using atan2
        const deltaY = frontY - rearY;
        const tiltAngle = Math.atan2(deltaY, TankConfig.TILT_SAMPLE_DISTANCE * 2) * Phaser.Math.RAD_TO_DEG;
        this.updateTilt(tiltAngle);
    }

    update(): void {
        // Handle movement
        this.handleMovement();

        // Constantly recalculate position using two-point sampling
        // This ensures the tank follows settling terrain naturally
        this.snapToTerrain();
    }

    private handleMovement(): void {
        // Handle turret aiming with up/down keys (continuous)
        if (this.cursors.up.isDown) {
            const currentAngle = this.getTurretAngle();
            this.setTurretAngle(currentAngle - 1); // Decrease angle (aim up)
        } else if (this.cursors.down.isDown) {
            const currentAngle = this.getTurretAngle();
            this.setTurretAngle(currentAngle + 1); // Increase angle (aim down)
        }

        // Check for move volley triggers (one-time key presses)
        if (Phaser.Input.Keyboard.JustDown(this.cursors.left)) {
            this.startMoveVolley(-1);
        } else if (Phaser.Input.Keyboard.JustDown(this.cursors.right)) {
            this.startMoveVolley(1);
        }

        // Update any active move volley
        this.updateMoveVolley();
    }

    private canMoveTo(newX: number): boolean {
        // Check bounds
        if (newX < 0 || newX >= this.terrain.width) {
            return false;
        }

        // Find current ground height
        let currentGroundY = this.terrain.height;
        for (let y = 0; y < this.terrain.height; y++) {
            if (this.terrain.pixels[y * this.terrain.width + Math.floor(this.x)] === 1) {
                currentGroundY = y;
                break;
            }
        }

        // Find new ground height
        let newGroundY = this.terrain.height;
        for (let y = 0; y < this.terrain.height; y++) {
            if (this.terrain.pixels[y * this.terrain.width + Math.floor(newX)] === 1) {
                newGroundY = y;
                break;
            }
        }

        // Check climb limit (max height difference)
        const heightDiff = Math.abs(newGroundY - currentGroundY);
        return heightDiff <= TankConfig.MAX_CLIMB_HEIGHT;
    }

    addScore(explosionX: number, explosionY: number, explosionRadius: number, maxPoints: number = TankConfig.MAX_EXPLOSION_POINTS): number {
        // Calculate distance from explosion center to tank center
        const distance = Phaser.Math.Distance.Between(this.x, this.y, explosionX, explosionY);

        // Linear falloff: 100% points at center, 0% at radius edge
        const scoreRatio = Math.max(0, 1 - (distance / explosionRadius));
        const points = Math.floor(scoreRatio * maxPoints);

        this.totalScore += points;
        console.log(`Tank scored ${points} points! Total score: ${this.totalScore}`);

        return points;
    }

    getScore(): number {
        return this.totalScore;
    }

    startMoveVolley(direction: number): boolean {
        // Check if we have move charges available
        if (this.moveCharges <= 0 || this.isMoving) {
            return false;
        }

        // Consume a move charge
        this.moveCharges--;

        // Start movement volley (pixels in the specified direction)
        this.isMoving = true;
        this.moveDirection = direction;
        this.moveTargetX = this.x + (direction * TankConfig.MOVE_DISTANCE);

        console.log(`Started move volley: ${this.moveCharges} charges remaining`);
        return true;
    }

    updateMoveVolley(): void {
        if (!this.isMoving) {
            return;
        }

        // Move one pixel at a time towards target
        const nextX = this.x + this.moveDirection;

        // Check if we've reached the target
        if ((this.moveDirection > 0 && nextX >= this.moveTargetX) ||
            (this.moveDirection < 0 && nextX <= this.moveTargetX)) {
            this.isMoving = false;
            this.snapToTerrain();
            return;
        }

        // Check bounds
        if (nextX < 0 || nextX >= this.terrain.width) {
            this.isMoving = false;
            return;
        }

        // Check steepness (cliff detection)
        if (!this.canMoveTo(nextX)) {
            this.isMoving = false;
            console.log('Hit a wall! Movement stopped.');
            return;
        }

        // Move to next position
        this.x = nextX;
        this.snapToTerrain();
    }

    updateTilt(angle: number): void {
        // Set chassis rotation to match terrain angle
        this.chassis.setAngle(angle);
        // Note: Turret maintains its absolute angle and is not affected by chassis tilt
    }

    destroy(): void {
        // Clean up textures if this is the last tank using them
        super.destroy();
        // Note: In a real implementation, you'd want to track texture usage
        // and only destroy when no longer needed
    }
}
