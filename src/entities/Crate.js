import BaseSprite from './BaseSprite';

export default class Crate extends BaseSprite {
  constructor(scene, x, y, tile) {
    super(scene, x, y, tile, 'crate');
  }
}
