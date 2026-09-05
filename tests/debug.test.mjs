import assert from 'node:assert/strict';
import test from 'node:test';

import { installBrowserEnvironment } from './helpers/browser.mjs';

installBrowserEnvironment();

const { default: Game } = await import( '../scripts/core/game.js' );
const { default: Draw } = await import( '../scripts/core/utilities/draw.js' );
const { default: Buffer } = await import( '../scripts/core/components/buffer.js' );
const { default: Layer } = await import( '../scripts/core/components/layer.js' );
const { default: Tile } = await import( '../scripts/core/tiles/tile.js' );
const { default: Collide } = await import( '../scripts/core/mechanics/collide.js' );
const { default: Debug } = await import( '../scripts/content/debug.js' );
const { default: Settings } = await import( '../scripts/content/settings.js' );

/** Contract: Collide exposes world-space diagnostic bounds without mutating physics or registering presentation hooks. */
test( 'Collide reports bounds independently of rendering', () => {
	Game.Hooks.reset();
	const collide = new Collide();
	assert.equal( collide.bounds(), null );
	assert.deepEqual( Game.Hooks.queued(), [] );
	const tile = { physics: {
		position: { x: 100, y: 80, z: 3 },
		size: { w: 20, h: 10, d: 1 },
	} };
	collide.set( tile );
	const before = structuredClone( tile.physics );
	assert.deepEqual( collide.bounds(), {
		position: { x: 80, y: 70, z: 3 },
		size: { w: 60, h: 30, d: 1 },
	} );
	collide.distance = 0;
	assert.deepEqual( collide.bounds(), before );
	collide.distance = 0.5;
	assert.deepEqual( collide.bounds(), {
		position: { x: 90, y: 75, z: 3 },
		size: { w: 40, h: 20, d: 1 },
	} );
	assert.deepEqual( tile.physics, before );
	collide.set( {} );
	assert.equal( collide.bounds(), null );
	collide.reset();
	assert.equal( collide.bounds(), null );
	assert.deepEqual( Game.Hooks.queued(), [] );
} );

/** Contract: Debug registers once when enabled and removes only its own hooks on reset, reconfiguration, and destruction. */
test( 'Debug owns optional listener lifecycle', t => {
	Game.Hooks.reset();
	const enabled = Settings.debug;
	t.after( () => {
		Settings.debug = enabled;
		Game.Hooks.reset();
	} );
	Settings.debug = false;
	const debug = new Debug();
	assert.equal( debug.enabled, false );
	assert.deepEqual( Game.Hooks.queued(), [] );
	assert.equal( debug.unhooks(), false );
	Settings.debug = true;
	assert.equal( debug.set(), debug );
	assert.equal( Game.Hooks.exists( 'Tile.render', debug.render ), true );
	debug.hooks();
	const other = new Debug( true );
	assert.equal( debug.unhooks(), true );
	assert.equal( debug.unhooks(), false );
	assert.equal( Game.Hooks.exists( 'Tile.render', other.render ), true );
	debug.hooks();
	assert.equal( debug.reset(), debug );
	assert.equal( Game.Hooks.exists( 'Tile.render', debug.render ), false );
	debug.set( true );
	debug.set( false );
	assert.equal( Game.Hooks.exists( 'Tile.render', debug.render ), false );
	debug.destroy();
	debug.destroy();
	other.destroy();
	assert.deepEqual( Game.Hooks.queued(), [] );
} );

/** Contract: Debug draws once in the Tile's Layer scope with its viewpoint and is inert without a drawable mechanic or enabled scope. */
test( 'Debug renders collision envelopes in the active Layer', t => {
	Game.Hooks.reset();
	const output = new Buffer( { w: 320, h: 240, d: 1 } );
	const tiles = [];
	const tile = new Tile( tiles, { x: 2, y: 2, z: 0 } );
	tile.mechanics = { collide: new Collide( tile ) };
	const layer = new Layer( null, 'actors', [ tiles ], false );
	const debug = new Debug( true );
	t.after( () => {
		debug.destroy();
		layer.destroy();
		tile.destroy();
		output.screen.ignore();
		output.destroy();
		Game.Hooks.reset();
	} );
	assert.equal( debug.render(), undefined );
	assert.equal( debug.render( tile ), undefined );
	Draw.use( output, { x: 16, y: 8, z: 0 }, layer.render );
	assert.deepEqual( layer.buffer.canvas.fillRectArgs, [ 16, 24, 96, 96 ] );
	assert.equal( layer.buffer.context.fillStyle, Debug.defaults.color );
	assert.equal( layer.buffer.context.globalAlpha, Debug.defaults.opacity );
	assert.equal( Draw.buffer, null );
	const physics = structuredClone( { x: tile.physics.position.x, y: tile.physics.position.y } );
	let draws = 0;
	layer.buffer.rect = () => draws++;
	debug.hooks();
	Draw.use( output, { x: 16, y: 8, z: 0 }, layer.render );
	assert.equal( draws, 2 );
	Draw.use( output, null, () => {
		debug.render();
		debug.render( {} );
		debug.render( { mechanics: { collide: new Collide() } } );
	} );
	debug.set( false );
	Draw.use( output, null, () => debug.render( tile ) );
	Draw.use( output, null, layer.render );
	assert.equal( draws, 3 );
	assert.deepEqual( { x: tile.physics.position.x, y: tile.physics.position.y }, physics );
} );
