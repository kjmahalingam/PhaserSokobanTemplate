import * as Phaser from 'phaser';

class BaseSprite extends Phaser.GameObjects.Sprite {
  constructor(scene, x, y, name) {
    super(scene, x, y, name);
    this.setOrigin(0);
  }
}

export default BaseSprite;