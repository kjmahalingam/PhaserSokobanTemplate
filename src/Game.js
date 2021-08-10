import Phaser from 'phaser';
import { PlayScene } from './scenes';

export const game = new Phaser.Game({
    type: Phaser.AUTO,
    width: window.innerWidth,
    height: window.innerHeight,
    scene: PlayScene
});
