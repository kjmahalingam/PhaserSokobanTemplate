import Crate from './Crate';

export default class NowCrate extends Crate {
    constructor(scene, x, y, tile) {
        super(scene, x, y, tile, 'now_crate');
    }
}
