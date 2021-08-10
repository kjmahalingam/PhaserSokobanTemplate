import Phaser from 'phaser';
import { Player, NowCrate, ThenCrate } from '../entities';
import { DURATION, DIRECTIONS } from '../utils/Movement';
import { MAX_LEVEL } from '../utils/Levels';

export default class PlayScene extends Phaser.Scene {
    constructor() {
        super();
    }

    init(data) {
        this.level = data.level || 1;
        this.victory = false;
    }

    preload() {
        this.load.tilemapTiledJSON(`level-${this.level}`, `src/assets/levels/level-${this.level}.json`);
        this.load.image('sokoban', 'src/assets/tilesheets/sokoban.png');
        this.load.image('now_crate', 'src/assets/sprites/now_crate.png');
        this.load.image('then_crate', 'src/assets/sprites/then_crate.png');
        this.load.image('player', 'src/assets/sprites/player.png');
    }

    create() {
        this.cursors = this.input.keyboard.createCursorKeys();
        this.tileMap = this.make.tilemap({ key: `level-${this.level}` });
        this.tileSet = this.tileMap.addTilesetImage('sokoban', 'sokoban', 128, 128);
        this.createLevel();
        this.input.keyboard.on('keydown', () => {
            if (this.victory) this.scene.restart( { level: this.level >= MAX_LEVEL ? 1 : this.level + 1 });
        });
    }

    update() {
        // TODO: Implement undo
        // if (Phaser.Input.Keyboard.JustDown(this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.Z))) this.undo();
        if (Phaser.Input.Keyboard.JustDown(this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.X))) this.scene.restart({ level: this.level });
        if (this.victory || this.player.isMoving) return;
        if (this.input.keyboard.checkDown(this.cursors.space, DURATION)) this.timeTravel();
        if (this.input.keyboard.checkDown(this.cursors.up, DURATION)) this.moveEntities(DIRECTIONS.NORTH);
        if (this.input.keyboard.checkDown(this.cursors.down, DURATION)) this.moveEntities(DIRECTIONS.SOUTH);
        if (this.input.keyboard.checkDown(this.cursors.left, DURATION)) this.moveEntities(DIRECTIONS.WEST);
        if (this.input.keyboard.checkDown(this.cursors.right, DURATION)) this.moveEntities(DIRECTIONS.EAST);
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
        this.checkVictory();
    }

    timeTravel() {
        const nextFloorTile = this.getTimeTravelTile(this.player.tile, this.floorLayer)
        if (!nextFloorTile) return;
        const nextWallTile = this.getTimeTravelTile(this.player.tile, this.wallLayer)
        if (nextWallTile) return;
        const nextCrate = this.getCrateByTile(nextFloorTile);
        if (nextCrate) return;
        this.player.moveTo(nextFloorTile);
        this.checkVictory();
    }

    createLevel() {
        this.createLayers();
        this.createAllGoalTiles();
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
        this.crateGoalLayer = this.tileMap.createLayer('CrateGoals', this.tileSet, x, y);
        this.goalLayer = this.tileMap.createLayer('Goal', this.tileSet, x, y);
    }

    createPlayer() {
        this.createSpawnTile();
        const { x, y } = this.tileMap.tileToWorldXY(this.spawnTile.x, this.spawnTile.y);
        this.player = new Player(this, x, y, this.spawnTile);
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

    createSpawnTile() {
        const spawns = this.getTilesByLayer(this.spawnLayer);
        if (!spawns) throw new Error('There is no spawn location.');
        if (spawns.length !== 1) throw new Error(' There is not exactly one spawn location.');
        this.spawnTile = spawns[0];
    }

    createAllGoalTiles() {
        this.createGoalTile();
        this.createCrateGoalTiles();
    }

    createGoalTile() {
        const goals = this.getTilesByLayer(this.goalLayer);
        if (!goals) throw new Error('There is no goal location.');
        if (goals.length !== 1) throw new Error(' There is not exactly one goal location.');
        this.goalTile = goals[0];
    }

    createCrateGoalTiles() {
        this.crateGoalTiles = this.getTilesByLayer(this.crateGoalLayer);
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
    
    checkVictory() {
        const playerOnGoal = this.player.tile.x === this.goalTile.x && this.player.tile.y === this.goalTile.y;
        const cratesOnGoals = this.crateGoalTiles.every(tile => this.getCrateByTile(tile));
        this.victory = playerOnGoal && cratesOnGoals;
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
