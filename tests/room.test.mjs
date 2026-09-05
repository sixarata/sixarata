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
	room.tiles.backgrounds.push(
			{ tick: () => calls.push( 'tick' ), update: () => calls.push( 'update' ), render: () => calls.push( 'render' ) },
			null,
	);
	assert.equal( 'buffer' in room, false );
	Object.values = ( ...args ) => {
		valueCalls++;

		return originalValues( ...args );
	};
	room.tick();
	room.update();
	room.render();
	room.loopTiles();

	assert.deepEqual( calls, [ 'tick', 'update', 'render' ] );
	assert.equal( valueCalls, 0 );
} );

/** Contract: Room clearing retains the collections referenced by its presentation Layers. */
test( 'Room preserves presentation collection identity on clear', () => {
	const room = new Room();
	const group = room.tiles.backgrounds;
	group.push( { destroy: () => group.pop() } );
	room.clear();
	assert.equal( room.tiles.backgrounds, group );
	assert.equal( room.layers[ 0 ].has( group ), true );
	assert.equal( group.length, 0 );
	assert.equal( room.layers[ 0 ].stale(), true );
} );

/** Contract: Room loops remain compatible without Object.hasOwn and skip inherited tile groups. */
test( 'Room loops own tile groups without Object.hasOwn', t => {
	Game.Hooks.reset();
	const room = new Room();
	const calls = [];
	const originalHasOwn = Object.hasOwn;
	t.after( () => {
		Object.hasOwn = originalHasOwn;
	} );
	room.tiles = Object.assign(
		Object.create( {
			inherited: [ { tick: () => calls.push( 'inherited' ) } ],
		} ),
		{
			owned: [ { tick: () => calls.push( 'owned' ) } ],
		}
	);
	Object.hasOwn = undefined;

	room.loopTiles( 'tick' );

	assert.deepEqual( calls, [ 'owned' ] );
} );

/** Contract: Room invalidates only the presentation Layer owning a changed Tile group. */
test( 'Room routes Tile changes to their owning Layers', () => {
	const room = new Room();

	room.clear();
	for ( const layer of room.layers ) {
		layer.cache.validate();
	}

	room.changed( { group: room.tiles.players } );
	assert.deepEqual(
		room.layers.map( layer => layer.cache.stale() ),
		[ false, true, false ]
	);
	assert.equal( room.layers[ 1 ].cache.reason, 'tile changed' );

	for ( const layer of room.layers ) {
		layer.cache.validate();
	}
	room.invalidate( null, 'layout changed' );
	assert.deepEqual(
		room.layers.map( layer => layer.cache.stale() ),
		[ true, true, true ]
	);
	assert.deepEqual(
		room.layers.map( layer => layer.cache.reason ),
		[ 'layout changed', 'layout changed', 'layout changed' ]
	);
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

/** Contract: Room visits surviving starting members once, skips removals, and defers additions within each group. */
test( 'Room handles membership changes during lifecycle passes', async () => {
	const { default: Entity } = await import( '../scripts/core/abstractions/entity.js' );
	for ( const callback of [ 'tick', 'update' ] ) {
		const room = new Room();
		const group = room.tiles.players;
		const calls = [];
		const first = new Entity( group );
		const removed = new Entity( group );
		const survivor = new Entity( group );
		first[ callback ] = () => {
			calls.push( 'first' );
			first.destroy();
			removed.destroy();
			const added = new Entity( group );
			added[ callback ] = () => calls.push( 'added' );
		};
		removed[ callback ] = () => calls.push( 'removed' );
		survivor[ callback ] = () => calls.push( 'survivor' );
		room.loopTiles( callback );
		assert.deepEqual( calls, [ 'first', 'survivor' ] );
		calls.length = 0;
		room.loopTiles( callback );
		assert.deepEqual( calls, [ 'survivor', 'added' ] );
		room.clear();
	}
} );

/** Contract: Tile removal and reassignment invalidate old Room layers while destruction retains its public hook. */
test( 'Room observes Tile membership removal independently of destruction', async () => {
	const { default: Tile } = await import( '../scripts/core/tiles/tile.js' );
	Game.Hooks.reset();
	const room = new Room();
	room.hooks();
	const tile = new Tile( room.tiles.backgrounds );
	const events = [];
	Game.Hooks.add( 'Tile.removed', item => events.push( [ 'removed', item.group ] ) );
	Game.Hooks.add( 'Tile.destroy', item => events.push( [ 'destroyed', item.group ] ) );
	const validate = () => room.layers.forEach( layer => layer.cache.validate() );
	validate();
	tile.remove();
	assert.deepEqual( room.layers.map( layer => layer.cache.stale() ), [ true, false, false ] );
	validate();
	tile.remove();
	assert.equal( room.layers[ 0 ].cache.valid(), true );
	tile.add();
	validate();
	tile.set( room.tiles.walls );
	assert.deepEqual( room.layers.map( layer => layer.cache.stale() ), [ true, false, true ] );
	validate();
	tile.destroy();
	assert.deepEqual( room.layers.map( layer => layer.cache.stale() ), [ false, false, true ] );
	assert.deepEqual( events, [
		[ 'removed', room.tiles.backgrounds ],
		[ 'removed', room.tiles.backgrounds ],
		[ 'removed', room.tiles.walls ],
		[ 'destroyed', room.tiles.walls ],
	] );
	Game.Hooks.reset();
	room.clear();
} );
