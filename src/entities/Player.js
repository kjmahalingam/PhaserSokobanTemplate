import BaseSprite from './BaseSprite';

class Player extends BaseSprite {
  constructor(scene, x, y) {
    super(scene, x, y, 'player');
  }
}

export default Player;