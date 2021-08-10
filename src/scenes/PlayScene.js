import Phaser from 'phaser';
import { Player, NowCrate, ThenCrate } from '../entities';
import { DIRECTIONS } from '../utils/Movement';

export default class PlayScene extends Phaser.Scene {
    constructor() {
        super();
    }

    preload() {
        this.load.tilemapTiledJSON('level', 'src/assets/levels/level.json');
        this.load.image('sokoban', 'src/assets/tilesheets/sokoban.png');
        this.load.image('now_crate', 'src/assets/sprites/now_crate.png');
        this.load.image('then_crate', 'src/assets/sprites/then_crate.png');
        this.load.image('player', 'src/assets/sprites/player.png');
    }

    create() {
        this.cursors = this.input.keyboard.createCursorKeys();
        this.tileMap = this.make.tilemap({ key: 'level' });
        this.tileSet = this.tileMap.addTilesetImage('sokoban', 'sokoban', 128, 128);
        this.createLevel();
    }

    update() {
        if (Phaser.Input.Keyboard.JustDown(this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.R))) this.scene.restart();
        if (this.player.victory || this.player.isMoving) return;
        if (Phaser.Input.Keyboard.JustDown(this.cursors.space)) this.timeTravel();
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
            if (nextCrate instanceof ThenCrate) {
                const nowBeyondFloorTile = this.getTimeTravelTile(beyondFloorTile, this.floorLayer);
                nextCrate.moveTo(beyondFloorTile, nowBeyondFloorTile);
            } else {
                nextCrate.moveTo(beyondFloorTile);
            }
        };
        this.player.moveTo(nextFloorTile);
    }

    timeTravel() {
        const nextFloorTile = this.getTimeTravelTile(this.player.tile, this.floorLayer)
        if (!nextFloorTile) return;
        const nextWallTile = this.getTimeTravelTile(this.player.tile, this.wallLayer)
        if (nextWallTile) return;
        const nextCrate = this.getCrateByTile(nextFloorTile);
        if (nextCrate) return;
        this.player.moveTo(nextFloorTile);
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
        this.spawnLayer = this.tileMap.createLayer('Spawn', this.tileSet, x, y);
        this.spawnLayer.setVisible(false);
        this.nowCrateLayer = this.tileMap.createLayer('NowCrates', this.tileSet, x, y);
        this.nowCrateLayer.setVisible(false);
        this.thenCrateLayer = this.tileMap.createLayer('ThenCrates', this.tileSet, x, y);
        this.thenCrateLayer.setVisible(false);
        this.floorLayer = this.tileMap.createLayer('Floor', this.tileSet, x, y);
        this.wallLayer = this.tileMap.createLayer('Walls', this.tileSet, x, y);
        this.goalLayer = this.tileMap.createLayer('Goal', this.tileSet, x, y);
    }

    createPlayer() {
        const { x, y } = this.tileMap.tileToWorldXY(this.spawnTile.x, this.spawnTile.y);
        this.player = new Player(this, x, y, this.spawnTile, this.goalTile);
        this.add.existing(this.player);
    }

    createCrates() {
        this.crates = [];
        const nowCrates = this.nowCrateTiles.map((tile) => {
            const { x, y } = this.tileMap.tileToWorldXY(tile.x, tile.y);
            const crate = new NowCrate(this, x, y, tile);
            this.add.existing(crate);
            return crate;
        });
        this.crates.push(...nowCrates);
        const thenCrates = this.thenCrateTiles.map((tile) => {
            const { x, y } = this.tileMap.tileToWorldXY(tile.x, tile.y);
            const nowCrate = this.getCrateByTile(this.getTimeTravelTile(tile, this.nowCrateLayer));
            const crate = new ThenCrate(this, x, y, tile, nowCrate);
            this.add.existing(crate);
            return crate;
        });
        this.crates.push(...thenCrates);
    }

    getCrateByTile(tile) {
        const { x, y } = this.tileMap.tileToWorldXY(tile.x, tile.y);
        return this.crates.find(c => c.x === x && c.y === y);
    }

    get spawnTile() {
        const spawns = this.getTilesByLayer(this.spawnLayer);
        if (!spawns) throw new Error('There is no spawn location.');
        if (spawns.length !== 1) throw new Error(' There is not exactly one spawn location.');
        return spawns[0];
    }

    get goalTile() {
        const goals = this.getTilesByLayer(this.goalLayer);
        if (!goals) throw new Error('There is no goal location.');
        if (goals.length !== 1) throw new Error(' There is not exactly one goal location.');
        return goals[0];
    }

    get nowCrateTiles() {
        return this.getTilesByLayer(this.nowCrateLayer);
    }

    get thenCrateTiles() {
        return this.getTilesByLayer(this.thenCrateLayer);
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

    getTimeTravelTile(currentTile, layer) {
        const { x, y } = currentTile;
        const newX = (x + (this.tileMap.width / 2)) % this.tileMap.width;
        return layer.getTileAt(newX, y);
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
