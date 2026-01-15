import Phaser from 'phaser';

class GameScene extends Phaser.Scene {
    constructor() {
        super('GameScene');
    }

    preload() {}

    create() {
        this.add.text(10, 10, 'Phaser Ready', { color: '#00ff00' });
    }

    update() {}
}

const config: Phaser.Types.Core.GameConfig = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    parent: 'game',
    physics: {
        default: 'arcade',
        arcade: { gravity: { y: 0 , x:0} }
    },
    scene: GameScene
};

new Phaser.Game(config);