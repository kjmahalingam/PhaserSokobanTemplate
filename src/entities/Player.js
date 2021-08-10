import BaseSprite from './BaseSprite';

class Player extends BaseSprite {
  constructor(scene, x, y, tile) {
    super(scene, x, y, tile, 'player');
  }
}

export default Player;