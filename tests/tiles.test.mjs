import assert from 'node:assert/strict';
import test from 'node:test';

import { installBrowserEnvironment } from './helpers/browser.mjs';

installBrowserEnvironment();

const { default: Game } = await import( '../scripts/core/game.js' );
const { default: Buffer } = await import( '../scripts/core/components/buffer.js' );
const { default: Door } = await import( '../scripts/core/tiles/door.js' );
const { default: Enemy } = await import( '../scripts/core/tiles/enemy.js' );
const { default: Particle } = await import( '../scripts/core/tiles/particle.js' );
const { default: Platform } = await import( '../scripts/core/tiles/platform.js' );
const { default: Player } = await import( '../scripts/core/tiles/player.js' );
const { default: Projectile } = await import( '../scripts/core/tiles/projectile.js' );
const { default: Tile } = await import( '../scripts/core/tiles/tile.js' );
const { default: Trigger } = await import( '../scripts/core/tiles/trigger.js' );
const { default: Wall } = await import( '../scripts/core/tiles/wall.js' );
const { default: Time } = await import( '../scripts/core/utilities/time.js' );

/** Prepare a visible logical viewport for tile rendering tests. */
const prepareView = () => {
	Game.Camera.position = { x: 0, y: 0, z: 0 };
	Game.View.buffer = new Buffer( { w: 320, h: 240, d: 1 } );
	Game.View.buffer.position = { x: 0, y: 0, z: 0 };
};

/** Contract: Tile initializes physics, emits lifecycle hooks, renders, and destroys itself. */
test( 'Tile initializes physics, emits lifecycle hooks, renders, and destroys itself', () => {
	prepareView();
	Game.Hooks.reset();
	const events = [];
	for ( const name of [ 'Tile.added', 'Tile.resize', 'Tile.tick', 'Tile.update', 'Tile.render', 'Tile.destroy' ] ) {
		Game.Hooks.add( name, tile => events.push( [ name, tile ] ) );
	}
	const group = [ { sentinel: true } ];
	const tile = new Tile( group, { x: 1, y: 2, z: 0 }, { w: 1, h: 1, d: 1 }, 'Blue', 'test', 0.5, 3, 0.75 );

	assert.equal( group.at( -1 ), tile );
	assert.equal( Number( tile.physics.mass ), 3 );
	assert.equal( tile.density, 0.5 );
	assert.deepEqual( [ tile.physics.position.x, tile.physics.position.y ], [ 32, 64 ] );
	tile.resize();
	tile.tick();
	tile.update();
	tile.render();
	assert.deepEqual( Game.View.buffer.canvas.fillRectArgs, [ 32, 64, 32, 32 ] );
	assert.equal( Game.View.buffer.context.fillStyle, 'Blue' );
	assert.equal( Game.View.buffer.context.globalAlpha, 0.75 );
	assert.ok( events.some( event => event[ 0 ] === 'Tile.render' ) );
	assert.equal( tile.destroy(), true );
	assert.equal( group.includes( tile ), false );
	assert.equal( tile.destroy(), false );
} );

/** Contract: Tile visibility rejects hidden, empty, and offscreen tiles. */
test( 'Tile visibility rejects hidden, empty, and offscreen tiles', () => {
	prepareView();
	const tile = new Tile( [], { x: 1, y: 1, z: 0 }, { w: 1, h: 1, d: 1 } );

	assert.equal( tile.viewable(), true );
	tile.visible = false;
	assert.equal( tile.viewable(), undefined );
	tile.visible = true;
	tile.physics.size.w = 0;
	assert.equal( tile.viewable(), undefined );
	tile.physics.size.w = 32;
	tile.physics.position.x = 1000;
	assert.equal( tile.viewable(), false );
	assert.deepEqual( [ tile.offset().x, tile.offset().y ], [ 1000, 32 ] );
} );

/** Contract: Concrete static tile classes preserve their semantic defaults. */
test( 'Concrete static tile classes preserve their semantic defaults', () => {
	const platforms = [];
	const walls = [];
	const triggers = [];
	const doors = [];
	const platform = new Platform( platforms, { x: 1, y: 1 }, { w: 2, h: 1, d: 1 }, 'grass', 0.75 );
	const wall = new Wall( walls, { x: 2, y: 1 }, { w: 1, h: 2, d: 1 }, 'rock', 0.8 );
	const trigger = new Trigger( triggers, { x: 3, y: 1 } );
	const door = new Door( doors, { x: 4, y: 1 }, { w: 1, h: 1, d: 1 }, 7 );

	assert.deepEqual( [ platform.color, platform.type, platform.density ], [ 'Green', 'grass', 0.75 ] );
	assert.deepEqual( [ wall.color, wall.type, wall.density ], [ '#555555', 'rock', 0.8 ] );
	assert.deepEqual( [ trigger.density, trigger.opacity ], [ 0, 0 ] );
	assert.deepEqual( [ door.room, door.color, door.density ], [ 7, 'Black', 0 ] );
	assert.equal( door.set( 8 ), door );
	assert.equal( door.room, 8 );
} );

/** Contract: Projectile trajectories move in two dimensions without artificial depth drift. */
test( 'Projectile trajectories move in two dimensions without artificial depth drift', () => {
	prepareView();
	const source = new Tile( [], { x: 1, y: 1, z: 0 }, { w: 1, h: 1, d: 1 } );
	const target = new Tile( [], { x: 4, y: 1, z: 0 }, { w: 1, h: 1, d: 1 } );
	const direct = new Projectile( [], source, target );
	const start = { ...direct.physics.position };
	Time.step = 100;
	direct.tick();

	assert.ok( direct.physics.position.x > start.x );
	assert.equal( direct.physics.position.y, start.y );
	assert.equal( direct.physics.position.z, start.z );
	assert.equal( direct.color, 'White' );

	const follow = new Projectile( [], source, target, undefined, 'follow' );
	const oldAngle = follow.angle;
	target.physics.position.y += 32;
	follow.tick();
	assert.notEqual( follow.angle, oldAngle );
	assert.equal( follow.color, 'Pink' );
} );

/** Contract: Particle movement, lifetime, and minimum size govern destruction. */
test( 'Particle movement, lifetime, and minimum size govern destruction', () => {
	prepareView();
	const source = new Tile( [], { x: 1, y: 1 }, { w: 1, h: 1, d: 1 } );
	const group = [];
	Time.now = 100;
	Time.step = 100;
	const particle = new Particle( group, source, 'White', { w: 0.1, h: 0.1, d: 0.1 }, { x: 10, y: -20, z: 0 }, 1000, 500 );
	const startX = particle.physics.position.x;
	particle.tick();
	assert.equal( particle.physics.position.x, startX + 1 );
	Time.now = 1100;
	assert.equal( particle.tick(), true );
	assert.equal( group.includes( particle ), false );

	Time.now = 200;
	const tiny = new Particle( group, source );
	tiny.physics.size.w = 0;
	tiny.physics.size.h = 0;
	tiny.physics.size.d = 0;
	assert.equal( tiny.tick(), true );
} );

/** Contract: Enemy shooting respects elapsed time and viewport eligibility. */
test( 'Enemy shooting respects elapsed time and viewport eligibility', () => {
	prepareView();
	const enemies = [];
	const enemy = new Enemy( enemies, { x: 1, y: 1 } );
	const player = new Tile( [], { x: 5, y: 1 }, { w: 1, h: 1, d: 1 } );
	Game.Room.tiles = { projectiles: [], players: [ player ] };
	Time.step = 2000;
	enemy.update();
	assert.equal( Game.Room.tiles.projectiles.length, 1 );
	assert.equal( enemy.shootElapsed, 0 );

	enemy.shootOffScreen = false;
	enemy.physics.position.x = -100;
	assert.equal( enemy.canShoot(), false );
	enemy.physics.position.x = 100;
	assert.equal( enemy.canShoot(), true );
	enemy.set();
	assert.equal( enemy.shootOffScreen, true );
} );

/** Contract: Player lifecycle orders checks and removes mechanic-owned hooks on destruction. */
test( 'Player lifecycle orders checks and removes mechanic-owned hooks on destruction', () => {
	prepareView();
	Game.Hooks.reset();
	const group = [];
	const player = new Player( group, { x: 1, y: 1 } );
	const order = [];
	player.checks = () => false;
	player.resize = () => order.push( 'resize' );
	player.reposition = () => order.push( 'reposition' );
	player.recolor = () => order.push( 'recolor' );
	player.respond = () => order.push( 'respond' );
	player.tick();
	assert.deepEqual( order, [ 'resize', 'reposition', 'recolor', 'respond' ] );
	player.checks = () => true;
	assert.equal( player.tick(), undefined );
	assert.equal( order.length, 4 );
	assert.equal( player.destroy(), true );
	assert.equal( group.includes( player ), false );
} );

/** Contract: Player fall, door, and projectile checks choose retry or room progression. */
test( 'Player fall, door, and projectile checks choose retry or room progression', () => {
	prepareView();
	const player = new Player( [], { x: 1, y: 1 } );
	const retryCalls = [];
	const loadCalls = [];
	Game.Room.size = { w: 320, h: 100 };
	Game.Room.retry = () => {
		retryCalls.push( true );
		return true;
	};
	Game.Room.load = id => loadCalls.push( id );
	Game.Room.tiles = { doors: [], projectiles: [] };
	player.physics.position.y = 101;
	assert.equal( player.checkFell(), true );
	assert.equal( retryCalls.length, 1 );

	player.physics.position.set( false );
	player.physics.position.x = 32;
	player.physics.position.y = 32;
	const door = new Door( [], { x: 1, y: 1 }, { w: 1, h: 1, d: 1 }, 4 );
	Game.Room.tiles.doors = [ door ];
	assert.equal( player.checkDoors(), true );
	assert.deepEqual( loadCalls, [ 4 ] );

	Game.Room.tiles.doors = [];
	Game.Room.tiles.projectiles = [ new Tile( [], { x: 1, y: 1 }, { w: 1, h: 1, d: 1 } ) ];
	assert.equal( player.checkProjectiles(), true );
	assert.equal( retryCalls.length, 2 );
	Game.Room.tiles.projectiles = [];
	assert.equal( player.checks(), false );
} );
