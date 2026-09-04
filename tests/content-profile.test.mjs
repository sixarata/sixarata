import assert from 'node:assert/strict';
import test from 'node:test';

import { installBrowserEnvironment } from './helpers/browser.mjs';

installBrowserEnvironment();

let animationId = 0;
globalThis.requestAnimationFrame = callback => {
	callback( performance.now() );

	return ++animationId;
};

const { default: Buffer } = await import( '../scripts/core/components/buffer.js' );
const { default: profileRenderer } = await import( '../scripts/content/profile.js' );

/** Contract: Renderer profiling compares redraw and cached strategies before restoring the live game loop. */
test( 'Renderer profiler restores ownership after measuring isolated static output', async () => {
	const output = new Buffer( { w: 320, h: 240, d: 1 } );
	const view = new Buffer( { w: 320, h: 240, d: 1 } );
	const calls = [];
	const game = {
		Frame: {
			paused: false,
			cancel: () => calls.push( 'cancel' ),
			request: () => calls.push( 'request' ),
		},
		Room: {
			buffer: output,
			tiles: {
				backgrounds: [ { render: () => game.Room.buffer.rect( '#111' ) } ],
				platforms:   [ { render: () => game.Room.buffer.rect( '#222' ) } ],
				doors:       [],
				walls:       [],
				enemies:     [],
				particles:   [],
				players:     [ { render: () => game.Room.buffer.rect( '#333' ) } ],
				projectiles: [],
			},
			render: () => {
				for ( const group of Object.values( game.Room.tiles ) ) {
					for ( const tile of group ) {
						tile.render();
					}
				}

				game.Room.buffer.put( view );
			},
		},
		View: {
			buffer: view,
		},
	};

	const report = await profileRenderer( game, 2 );

	assert.equal( report.redraw.count, 2 );
	assert.equal( report.cached.count, 2 );
	assert.ok( report.redraw.min >= 0 );
	assert.ok( report.cached.p95 >= report.cached.median );
	assert.equal( game.Room.buffer, output );
	assert.equal( game.Frame.paused, false );
	assert.deepEqual( calls, [ 'cancel', 'request' ] );
} );
