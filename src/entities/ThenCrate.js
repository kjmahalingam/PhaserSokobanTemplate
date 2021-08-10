import Crate from './Crate';

export default class ThenCrate extends Crate {
    constructor(scene, x, y, tile, nowCrate) {
        super(scene, x, y, tile, 'then_crate');
        this.nowCrate = nowCrate;
    }

    // moveTo(tile) {
    //     this.tile = tile;
    //     this.scene.tweens.add({
    //       targets: this,
    //       x: tile.pixelX,
    //       y: tile.pixelY,
    //       duration: DURATION,
    //       ease: Phaser.Math.Easing.Quartic.Out
    //     });
    // }

    moveTo(tile, nowTile) {
        super.moveTo(tile);
        this.nowCrate.moveTo(nowTile);
    }
}