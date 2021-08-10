import BaseSprite from './BaseSprite';

export default class Player extends BaseSprite {
  constructor(scene, x, y, tile) {
    super(scene, x, y, tile, 'player');
  }
}
