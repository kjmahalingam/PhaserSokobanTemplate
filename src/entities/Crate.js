import BaseSprite from './BaseSprite';

class Crate extends BaseSprite {
  constructor(scene, x, y, tile) {
    super(scene, x, y, tile, 'crate');
  }
}

export default Crate;