import assert from 'node:assert/strict';
import test from 'node:test';

import { installBrowserEnvironment } from './helpers/browser.mjs';

installBrowserEnvironment();

let animationId = 0;
globalThis.requestAnimationFrame = callback => {
	callback( performance.now() );

	return ++animationId;
};

const { default: Draw } = await import( '../scripts/core/utilities/draw.js' );
const { default: Buffer } = await import( '../scripts/core/components/buffer.js' );
const { default: Layer } = await import( '../scripts/core/components/layer.js' );
const { default: profileRenderer } = await import( '../scripts/content/profile.js' );

/** Contract: Renderer profiling compares redraw, cached, and moving strategies before restoring the live game loop. */
test( 'Renderer profiler restores Layer policies and the live game loop', async () => {
	const view = new Buffer( { w: 320, h: 240, d: 1 } );
	const calls = [];
	const game = {
		Frame: {
			paused: false,
			cancel: () => calls.push( 'cancel' ),
			request: () => calls.push( 'request' ),
		},
		Camera: {
			position: { x: 0, y: 0, z: 0 },
		},
		Room: {
			tiles: {
				backgrounds: [ { render: () => Draw.buffer.rect( '#111' ) } ],
				platforms:   [ { render: () => Draw.buffer.rect( '#222' ) } ],
				doors:       [],
				walls:       [],
				enemies:     [],
				particles:   [],
				players:     [ { render: () => Draw.buffer.rect( '#333' ) } ],
				projectiles: [],
			},
		},
		View: {
			buffer: view,
		},
	};
	game.Room.layers = [
		new Layer( null, 'background', [ game.Room.tiles.backgrounds, game.Room.tiles.platforms, game.Room.tiles.doors ] ),
		new Layer( null, 'actors', [ game.Room.tiles.enemies, game.Room.tiles.particles, game.Room.tiles.players, game.Room.tiles.projectiles ], false ),
		new Layer( null, 'foreground', [ game.Room.tiles.walls ] ),
	];
	game.Room.render = () => Draw.use( view, game.Camera.position, () => {
		for ( const layer of game.Room.layers ) {
			layer.render();
		}
	} );
	for ( const layer of game.Room.layers ) {
		layer.resize( view.size );
	}

	const report = await profileRenderer( game, 2 );

	assert.equal( report.redraw.count, 2 );
	assert.equal( report.cached.count, 2 );
	assert.equal( report.moving.count, 2 );
	assert.ok( report.redraw.min >= 0 );
	assert.ok( report.cached.p95 >= report.cached.median );
	assert.equal( 'buffer' in game.Room, false );
	assert.equal( Draw.buffer, null );
	assert.equal( game.Frame.paused, false );
	assert.deepEqual( game.Camera.position, { x: 0, y: 0, z: 0 } );
	assert.deepEqual( calls, [ 'cancel', 'request' ] );
	assert.deepEqual( game.Room.layers.map( layer => layer.cached ), [ true, false, true ] );

	for ( const layer of game.Room.layers ) {
		layer.destroy();
	}
} );
