import BaseSprite from './BaseSprite';

class Player extends BaseSprite {
  constructor(scene, x, y, tile) {
    super(scene, x, y, tile, 'player');
    this.victory = false;
  }

  checkVictory(goalTile) {
      this.victory = goalTile.x === this.tile.x && goalTile.y === this.tile.y;
  }
}

export default Player;