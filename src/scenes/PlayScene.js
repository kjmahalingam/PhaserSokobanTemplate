import Phaser from 'phaser';
import { Player, Crate } from '../entities';
import { DURATION, DIRECTIONS, MAX_LEVEL } from '../utils/constants';
import { filterTilesByExistence, getNextTile } from '../utils/helpers';

export default class PlayScene extends Phaser.Scene {
  init(data) {
    this.level = data.level || 1;
    this.victory = false;
    this.undoStack = [];
  }

  preload() {
    this.load.tilemapTiledJSON(`level-${this.level}`, `assets/levels/level-${this.level}.json`);
    this.load.image('sokoban', 'assets/tilesheets/sokoban.png');
    this.load.image('crate', 'assets/sprites/crate.png');
    this.load.image('player', 'assets/sprites/player.png');
  }

  create() {
    this.cursors = this.input.keyboard.createCursorKeys();
    this.tileMap = this.make.tilemap({ key: `level-${this.level}` });
    this.tileSet = this.tileMap.addTilesetImage('sokoban', 'sokoban', 128, 128);
    this.createLevel();
    this.input.keyboard.on('keydown', () => {
      if (this.victory) this.scene.restart({ level: this.level >= MAX_LEVEL ? 1 : this.level + 1 });
    });
  }

  update() {
    if (Phaser.Input.Keyboard.JustDown(this.cursors.space)) this.scene.restart({ level: this.level });
    if (this.victory || this.player.isMoving) return;
    if (this.input.keyboard.checkDown(this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.Z), DURATION)) {
      this.undo();
    }
    if (this.input.keyboard.checkDown(this.cursors.up, DURATION)) this.moveEntities(DIRECTIONS.NORTH);
    if (this.input.keyboard.checkDown(this.cursors.down, DURATION)) this.moveEntities(DIRECTIONS.SOUTH);
    if (this.input.keyboard.checkDown(this.cursors.left, DURATION)) this.moveEntities(DIRECTIONS.WEST);
    if (this.input.keyboard.checkDown(this.cursors.right, DURATION)) this.moveEntities(DIRECTIONS.EAST);
  }

  undo() {
    const previousState = this.undoStack.pop();
    if (!previousState) return;
    this.player.moveTo(previousState.playerTile);
    this.crates.forEach((c, i) => c.moveTo(previousState.crateTiles[i]));
  }

  saveState() {
    this.undoStack.push({ playerTile: this.player.tile, crateTiles: this.crates.map((c) => c.tile) });
  }

  moveEntities(direction) {
    const nextFloorTile = getNextTile(this.player.tile, direction, this.floorLayer);
    if (!nextFloorTile) return;
    const nextWallTile = getNextTile(this.player.tile, direction, this.wallLayer);
    if (nextWallTile) return;
    const nextCrate = this.getCrateByTile(nextFloorTile);
    if (nextCrate) {
      const beyondFloorTile = getNextTile(nextFloorTile, direction, this.floorLayer);
      if (!beyondFloorTile) return;
      const beyondWallTile = getNextTile(nextFloorTile, direction, this.wallLayer);
      if (beyondWallTile) return;
      const beyondCrateTile = this.getCrateByTile(beyondFloorTile);
      if (beyondCrateTile) return;
      this.saveState();
      nextCrate.moveTo(beyondFloorTile);
    } else {
      this.saveState();
    }
    this.player.moveTo(nextFloorTile);
    this.checkVictory();
  }

  getCrateByTile(tile) {
    return this.crates.find((c) => c.tile.x === tile.x && c.tile.y === tile.y);
  }

  getTilesByLayer(layer, test = filterTilesByExistence) {
    this.tileMap.setLayer(layer);
    return this.tileMap.filterTiles((tile) => test(tile), this, 0, 0, this.tileMap.width, this.tileMap.height);
  }

  checkVictory() {
    const playerOnGoal = this.player.tile.x === this.goalTile.x && this.player.tile.y === this.goalTile.y;
    const cratesOnGoals = this.crateGoalTiles.every((tile) => this.getCrateByTile(tile));
    this.victory = playerOnGoal && cratesOnGoals;
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
    this.crateLayer = this.tileMap.createLayer('Crates', this.tileSet, x, y);
    this.crateLayer.setVisible(false);
    this.floorLayer = this.tileMap.createLayer('Floor', this.tileSet, x, y);
    this.wallLayer = this.tileMap.createLayer('Walls', this.tileSet, x, y);
    this.crateGoalLayer = this.tileMap.createLayer('CrateGoals', this.tileSet, x, y);
    this.goalLayer = this.tileMap.createLayer('Goal', this.tileSet, x, y);
  }

  createAllGoalTiles() {
    this.createGoalTile();
    this.createCrateGoalTiles();
  }

  createGoalTile() {
    const goals = this.getTilesByLayer(this.goalLayer);
    if (!goals) throw new Error('There is no goal location.');
    if (goals.length !== 1) throw new Error(' There is not exactly one goal location.');
    [this.goalTile] = goals;
  }

  createCrateGoalTiles() {
    this.crateGoalTiles = this.getTilesByLayer(this.crateGoalLayer);
  }

  createPlayer() {
    this.createSpawnTile();
    const { x, y } = this.tileMap.tileToWorldXY(this.spawnTile.x, this.spawnTile.y);
    this.player = new Player(this, x, y, this.spawnTile);
    this.add.existing(this.player);
  }

  createSpawnTile() {
    const spawns = this.getTilesByLayer(this.spawnLayer);
    if (!spawns) throw new Error('There is no spawn location.');
    if (spawns.length !== 1) throw new Error(' There is not exactly one spawn location.');
    [this.spawnTile] = spawns;
  }

  createCrates() {
    this.crates = this.getTilesByLayer(this.crateLayer).map((tile) => {
      const { x, y } = this.tileMap.tileToWorldXY(tile.x, tile.y);
      const crate = new Crate(this, x, y, tile);
      this.add.existing(crate);
      return crate;
    });
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
