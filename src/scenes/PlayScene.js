import Phaser from 'phaser';
import Crate from '../entities/Crate';
import Player from '../entities/Player';

export default class PlayScene extends Phaser.Scene {
    constructor() {
        super();
    }

    preload() {
        this.load.tilemapTiledJSON('level', 'src/assets/levels/level.json');
        this.load.image('sokoban', 'src/assets/tilesheets/sokoban.png');

        this.load.image('crate', 'src/assets/sprites/crate.png');
        this.load.image('player', 'src/assets/sprites/player.png');
    }

    create() {
        this.cursors = this.input.keyboard.createCursorKeys();

        this.tileMap = this.make.tilemap({ key: 'level' });
        this.tileSet = this.tileMap.addTilesetImage('sokoban', 'sokoban', 128, 128);

        this.createLevel();
    }

    update() {
        // TODO: Implement player movement checks here

        // TODO: Include reset here
        // if (Phaser.Input.Keyboard.JustDown(this.cursors.space)) {
        // }
    }

    createLevel() {
        this.createLayers();
        this.createCrates();
        this.createPlayer();
        this.centerCamera();
    }

    createLayers() {
        const x = 0;
        const y = 0;
        this.spawnLayer = this.tileMap.createLayer('Spawns', this.tileSet, x, y);
        this.spawnLayer.setVisible(false);
        this.crateLayer = this.tileMap.createLayer('Crates', this.tileSet, x, y);
        this.crateLayer.setVisible(false);
        this.floorLayer = this.tileMap.createLayer('Floors', this.tileSet, x, y);
        this.wallLayer = this.tileMap.createLayer('Walls', this.tileSet, x, y);
        this.goalLayer = this.tileMap.createLayer('Goals', this.tileSet, x, y);
    }

    createCrates() {
        const crateTiles = this.getCrates();
        const crateSprites = crateTiles.map((tile) => {
            const { x, y } = this.tileMap.tileToWorldXY(tile.x, tile.y);
            const crate = new Crate(this, x, y);
            this.add.existing(crate);
            return crate;
        });
        this.crates = this.add.group(crateSprites);
    }

    createPlayer() {
        const playerSpawn = this.getSpawn();
        const { x, y } = this.tileMap.tileToWorldXY(playerSpawn.x, playerSpawn.y);
        this.player = new Player(this, x, y);
        this.add.existing(this.player);
    }

    getSpawn() {
        const spawns = this.getTiles(this.spawnLayer);
        return spawns[0];
    }

    getCrates() {
        return this.getTiles(this.crateLayer);
    }

    getTiles(layer, test = this.filterTilesByExistence) {
        this.tileMap.setLayer(layer);
        return this.tileMap.filterTiles((tile) => test(tile), this, 0, 0, this.tileMap.width, this.tileMap.height);
    }

    filterTilesByExistence(tile) {
        return tile.index > -1;
    }

    centerCamera() {
        const x = window.innerWidth / 2 - this.tileMap.widthInPixels / 2;
        const y = window.innerHeight / 2 - this.tileMap.heightInPixels / 2;
        this.cameras.remove(this.cameras.main);
        const camera = this.cameras.add(x, y, this.tileMap.widthInPixels, this.tileMap.heightInPixels, true);
        camera.setOrigin(0, 0);
        camera.setScroll(0, 0);
    }
}
