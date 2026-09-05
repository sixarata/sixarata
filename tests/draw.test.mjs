import assert from 'node:assert/strict';
import test from 'node:test';

import { installBrowserEnvironment } from './helpers/browser.mjs';

installBrowserEnvironment();

const { default: Game } = await import( '../scripts/core/game.js' );
const { default: Draw } = await import( '../scripts/core/utilities/draw.js' );
const { default: Buffer } = await import( '../scripts/core/components/buffer.js' );
const { default: Layer } = await import( '../scripts/core/components/layer.js' );
const { default: Room } = await import( '../scripts/core/components/room.js' );
const { default: Tile } = await import( '../scripts/core/tiles/tile.js' );

/** Contract: Draw scopes borrow references, return callback results, and restore enclosing state after success or failure. */
test( 'Draw owns synchronous nested drawing scopes', () => {
	assert.equal( Draw.set(), Draw );
	assert.equal( Draw.buffer, null );
	assert.equal( Draw.viewpoint, null );
	const first = {};
	const second = {};
	const position = { x: 32, y: 0, z: 0 };
	const result = Draw.use( first, position, () => {
		assert.equal( Draw.buffer, first );
		assert.equal( Draw.viewpoint, position );
		assert.throws( () => Draw.use( second, null, () => {
			assert.equal( Draw.buffer, second );
			throw new Error( 'draw failed' );
		} ), /draw failed/ );
		assert.equal( Draw.buffer, first );
		assert.equal( Draw.viewpoint, position );
		assert.throws( () => Draw.use( null, null, null ), TypeError );
		assert.equal( Draw.buffer, first );
		return 42;
	} );
	assert.equal( result, 42 );
	assert.equal( Draw.buffer, null );
	assert.equal( Draw.viewpoint, null );
	assert.equal( Draw.reset(), Draw );
} );

/** Contract: A Tile draws into each active Layer using that pass's viewpoint and viewport without persistent ownership. */
test( 'Tile drawing follows Layer destinations and scoped viewpoints', () => {
	const output = new Buffer( { w: 320, h: 240, d: 1 } );
	const tiles = [];
	const tile = new Tile( tiles, { x: 2, y: 1, z: 0 }, { w: 1, h: 1, d: 1 }, 'Red' );
	const first = new Layer( null, 'first', [ tiles ] );
	const second = new Layer( null, 'second', [ tiles ] );
	Draw.use( output, { x: 0, y: 0, z: 0 }, first.render );
	Draw.use( output, { x: 32, y: 0, z: 0 }, second.render );
	assert.notEqual( first.buffer, second.buffer );
	assert.deepEqual( first.buffer.canvas.fillRectArgs, [ 64, 32, 32, 32 ] );
	assert.deepEqual( second.buffer.canvas.fillRectArgs, [ 32, 32, 32, 32 ] );
	assert.equal( tile.group, tiles );
	assert.equal( 'parent' in tile, false );
	assert.equal( Draw.buffer, null );
	assert.equal( tile.render(), undefined );
	const small = new Buffer( { w: 16, h: 16, d: 1 } );
	Draw.use( small, { x: 0, y: 0, z: 0 }, tile.render );
	assert.equal( small.canvas.fillRectArgs, undefined );
	Draw.use( small, { x: 64, y: 32, z: 0 }, tile.render );
	assert.deepEqual( small.canvas.fillRectArgs, [ 0, 0, 32, 32 ] );
	first.destroy();
	second.destroy();
	tile.destroy();
	for ( const buffer of [ output, small ] ) {
		buffer.screen.ignore();
		buffer.destroy();
	}
} );

/** Contract: Room owns no intermediate surface and composites its independent Layers into View in back-to-front order. */
test( 'Room renders Layer surfaces directly into View', t => {
	const room = new Room();
	const view = Game.View.buffer;
	const originalDrawImage = view.context.drawImage;
	const originalPosition = Game.Camera.position;
	Game.Camera.position = { x: 0, y: 0, z: 0 };
	t.after( () => {
		view.context.drawImage = originalDrawImage;
		Game.Camera.position = originalPosition;
		for ( const layer of room.layers ) {
			layer.destroy();
		}
	} );
	const canvases = [];
	view.context.drawImage = canvas => canvases.push( canvas );
	room.tiles.backgrounds.push( { render: () => Draw.buffer.rect( 'Blue' ) } );
	room.tiles.players.push( { render: () => Draw.buffer.rect( 'Red' ) } );
	room.tiles.walls.push( { render: () => Draw.buffer.rect( 'Green' ) } );
	room.render();
	assert.equal( 'buffer' in room, false );
	assert.deepEqual( canvases, room.layers.map( layer => layer.buffer.canvas ) );
	assert.equal( new Set( canvases ).size, 3 );
	assert.deepEqual( room.layers.map( layer => layer.buffer.context.fillStyle ), [ 'Blue', 'Red', 'Green' ] );
	assert.equal( Draw.buffer, null );
	room.tiles.players.push( { render: () => { throw new Error( 'actor failed' ); } } );
	assert.throws( room.render, /actor failed/ );
	assert.equal( Draw.buffer, null );
	assert.equal( Draw.viewpoint, null );
	assert.equal( Game.View.buffer, view );
} );
