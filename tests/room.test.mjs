import assert from 'node:assert/strict';
import test from 'node:test';

import { installBrowserEnvironment } from './helpers/browser.mjs';

installBrowserEnvironment();

const { default: Game } = await import( '../scripts/core/game.js' );
const { default: Room } = await import( '../scripts/core/components/room.js' );

/** Contract: Room parses every configured tile token and preserves ragged dimensions. */
test( 'Room parses every configured tile token and preserves ragged dimensions', () => {
	Game.Hooks.reset();
	const room = new Room();
	room.rooms = [ [ 'cxPeGB', 'r' ] ];
	room.hooks();
	room.load( 0, 1 );

	assert.deepEqual( [ room.size.w, room.size.h ], [ 192, 64 ] );
	assert.equal( room.tiles.backgrounds.length, 1 );
	assert.equal( room.tiles.platforms.length, 1 );
	assert.equal( room.tiles.players.length, 1 );
	assert.equal( room.tiles.enemies.length, 1 );
	assert.equal( room.tiles.doors.length, 2 );
	assert.equal( room.tiles.walls.length, 1 );
	assert.equal( room.playerGrid, true );
	room.clear();
} );

/** Contract: Room ignores blank and unknown cells while still announcing parsed tokens. */
test( 'Room ignores blank cells and safely accepts unknown tokens', () => {
	Game.Hooks.reset();
	const room = new Room();
	room.clear();
	const seen = [];
	Game.Hooks.add( 'Room.parseTile', token => seen.push( token ) );
	room.grid = [ '   ', '?' ];
	room.parseRow( 0 );
	room.parseRow( 1 );
	room.parseTile();

	assert.deepEqual( seen, [ '?' ] );
	assert.equal( Object.values( room.tiles ).flat().length, 0 );
} );

/** Contract: Room supplies directional fallback player positions when no player is encoded. */
test( 'Room chooses the appropriate directional fallback player position', () => {
	Game.Hooks.reset();
	const room = new Room();
	room.clear();
	room.id = 1;
	room.previous = 2;
	room.playerPrev = { x: 3, y: 4 };
	room.player();
	assert.equal( room.tiles.players.length, 1 );
	assert.deepEqual(
		[ room.tiles.players[ 0 ].physics.position.x, room.tiles.players[ 0 ].physics.position.y ],
		[ 96, 128 ]
	);
	const player = room.tiles.players[ 0 ];
	room.player();
	assert.equal( room.tiles.players[ 0 ], player );
	room.clear();
} );

/** Contract: Room loops skip holes and forward each lifecycle event to present tiles. */
test( 'Room forwards tick, update, and render across tile groups', t => {
	Game.Hooks.reset();
	const room = new Room();
	const calls = [];
	const originalValues = Object.values;
	let valueCalls = 0;
	t.after( () => {
		Object.values = originalValues;
	} );
	room.tiles = {
		items: [
			{ tick: () => calls.push( 'tick' ), update: () => calls.push( 'update' ), render: () => calls.push( 'render' ) },
			null,
		],
	};
	room.buffer.put = () => calls.push( 'put' );
	Object.values = ( ...args ) => {
		valueCalls++;

		return originalValues( ...args );
	};
	room.tick();
	room.update();
	room.render();
	room.loopTiles();

	assert.deepEqual( calls, [ 'tick', 'update', 'render', 'put' ] );
	assert.equal( valueCalls, 0 );
} );

/** Contract: Room retry reloads the current room and reports that callers should bail. */
test( 'Room retry reloads the current room', () => {
	Game.Hooks.reset();
	const room = new Room();
	room.rooms = [ [ 'P' ] ];
	room.load( 0, 4 );
	assert.equal( room.retry(), true );
	assert.equal( room.id, 0 );
	assert.equal( room.previous, 4 );
	room.clear();
} );
