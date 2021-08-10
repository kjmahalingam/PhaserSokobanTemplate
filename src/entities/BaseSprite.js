import Phaser from 'phaser';
import { DURATION } from '../utils/Movement'

export default class BaseSprite extends Phaser.GameObjects.Sprite {
  constructor(scene, x, y, tile, name) {
    super(scene, x, y, name);
    this.tile = tile;
    this.setOrigin(0);
  }

  moveTo(tile) {
    this.tile = tile;
    this.scene.tweens.add({
      targets: this,
      x: tile.pixelX,
      y: tile.pixelY,
      duration: DURATION,
      ease: Phaser.Math.Easing.Quartic.Out
    });
  }

  get isMoving() {
    return this.scene.tweens.isTweening(this);
  }
}
