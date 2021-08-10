import * as Phaser from 'phaser';

class BaseSprite extends Phaser.GameObjects.Sprite {
  constructor(scene, x, y, tile, name) {
    super(scene, x, y, name);
    this.tile = tile;
    this.setOrigin(0);
  }

  moveTo(tile) {
    this.x = tile.pixelX;
    this.y = tile.pixelY;
    this.tile = tile;
  }
}

export default BaseSprite;