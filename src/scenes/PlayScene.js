import { Scene } from 'phaser';
import { Crate, Player } from '../entities';
import { DIRECTIONS } from '../utils/Movement';

export default class PlayScene extends Scene {
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
        this.victory = false;
        this.createLevel();
    }

    update() {
        if (Phaser.Input.Keyboard.JustDown(this.cursors.space)) this.scene.restart();
        if (this.victory) return;
        if (Phaser.Input.Keyboard.JustDown(this.cursors.up)) this.moveEntities(DIRECTIONS.NORTH);
        if (Phaser.Input.Keyboard.JustDown(this.cursors.down)) this.moveEntities(DIRECTIONS.SOUTH);
        if (Phaser.Input.Keyboard.JustDown(this.cursors.left)) this.moveEntities(DIRECTIONS.WEST);
        if (Phaser.Input.Keyboard.JustDown(this.cursors.right)) this.moveEntities(DIRECTIONS.EAST);
    }

    moveEntities(direction) {
        const nextFloorTile = this.getNextTile(this.player.tile, direction, this.floorLayer);
        if (!nextFloorTile) return;
        const nextWallTile = this.getNextTile(this.player.tile, direction, this.wallLayer);
        if (nextWallTile) return;
        const nextCrate = this.getCrateByTile(nextFloorTile);
        if (nextCrate) {
            const beyondFloorTile = this.getNextTile(nextFloorTile, direction, this.floorLayer);
            if (!beyondFloorTile) return;
            const beyondWallTile = this.getNextTile(nextFloorTile, direction, this.wallLayer);
            if (beyondWallTile) return;
            const beyondCrateTile = this.getCrateByTile(beyondFloorTile);
            if (beyondCrateTile) return;
            nextCrate.moveTo(beyondFloorTile);
        };
        this.player.moveTo(nextFloorTile);
        this.checkVictory();
    }

    createLevel() {
        this.createLayers();
        this.createPlayer();
        this.createCrates();
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
        this.goalTile = this.getGoalTile();
    }

    createPlayer() {
        const tile = this.getSpawnTile();
        const { x, y } = this.tileMap.tileToWorldXY(tile.x, tile.y);
        this.player = new Player(this, x, y, tile);
        this.add.existing(this.player);
    }

    createCrates() {
        const crateTiles = this.getCrateTiles();
        const crates = crateTiles.map((tile) => {
            const { x, y } = this.tileMap.tileToWorldXY(tile.x, tile.y);
            const crate = new Crate(this, x, y, tile);
            this.add.existing(crate);
            return crate;
        });
        this.crates = this.add.group(crates);
    }

    getCrateByTile(tile) {
        const { x, y } = this.tileMap.tileToWorldXY(tile.x, tile.y);
        return this.crates.getChildren().find(c => c.x === x && c.y === y);
    }

    getSpawnTile() {
        const spawns = this.getTilesByLayer(this.spawnLayer);
        if (!spawns) throw new Error('There is no spawn location.');
        if (spawns.length !== 1) throw new Error(' There is not exactly one spawn location.');
        return spawns[0];
    }

    getGoalTile() {
        const goals = this.getTilesByLayer(this.goalLayer);
        if (!goals) throw new Error('There is no goal location.');
        if (goals.length !== 1) throw new Error(' There is not exactly one goal location.');
        return goals[0];
    }

    getCrateTiles() {
        return this.getTilesByLayer(this.crateLayer);
    }

    getTilesByLayer(layer, test = this.filterTilesByExistence) {
        this.tileMap.setLayer(layer);
        return this.tileMap.filterTiles((tile) => test(tile), this, 0, 0, this.tileMap.width, this.tileMap.height);
    }

    getNextTile(currentTile, direction, layer) {
        const { x, y } = currentTile;
        switch (direction) {
            case DIRECTIONS.NORTH:
                return layer.getTileAt(x, y - 1);
            case DIRECTIONS.SOUTH:
                return layer.getTileAt(x, y + 1);
            case DIRECTIONS.WEST:
                return layer.getTileAt(x - 1, y);
            case DIRECTIONS.EAST:
                return layer.getTileAt(x + 1, y);
            default:
                throw new Error('Invalid direction provided.');
        }
    }

    filterTilesByExistence(tile) {
        return tile.index > -1;
    }

    checkVictory() {
        this.victory = this.goalTile.x === this.player.tile.x && this.goalTile.y === this.player.tile.y;
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
