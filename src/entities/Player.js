import BaseSprite from './BaseSprite';

export default class Player extends BaseSprite {
  constructor(scene, x, y, tile, goalTile) {
    super(scene, x, y, tile, 'player');
    this.goalTile = goalTile;
    this.victory = false;
  }

  moveTo(tile) {
    super.moveTo(tile);
    this.checkVictory();
  }

  checkVictory() {
      this.victory = this.goalTile.x === this.tile.x && this.goalTile.y === this.tile.y;
  }
}
