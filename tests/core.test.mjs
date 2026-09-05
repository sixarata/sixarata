import assert from 'node:assert/strict';
import test from 'node:test';

import { installBrowserEnvironment } from './helpers/browser.mjs';

const browser = installBrowserEnvironment();

const { default: Game } = await import( '../scripts/core/game.js' );
const Abstractions = await import( '../scripts/core/abstractions/exports.js' );
const { default: Attributes } = await import( '../scripts/core/abstractions/attributes.js' );
const { default: Entity } = await import( '../scripts/core/abstractions/entity.js' );
const { default: Generic } = await import( '../scripts/core/abstractions/generic.js' );
const { default: Buffer } = await import( '../scripts/core/components/buffer.js' );
const { default: Camera } = await import( '../scripts/core/components/camera.js' );
const { default: Clock } = await import( '../scripts/core/components/clock.js' );
const { default: Frame } = await import( '../scripts/core/components/frame.js' );
const { default: Hud } = await import( '../scripts/core/components/hud.js' );
const { default: Layer } = await import( '../scripts/core/components/layer.js' );
const { default: View } = await import( '../scripts/core/components/view.js' );
const { default: Combos } = await import( '../scripts/core/controls/combo.js' );
const { default: History } = await import( '../scripts/core/controls/history.js' );
const { default: Device } = await import( '../scripts/core/inputs/device.js' );
const { default: Inputs } = await import( '../scripts/core/interfaces/inputs.js' );
const { default: Screen } = await import( '../scripts/core/interfaces/screen.js' );
const { default: Jobs } = await import( '../scripts/core/utilities/jobs.js' );
const { default: Time } = await import( '../scripts/core/utilities/time.js' );
const { default: Timer } = await import( '../scripts/core/utilities/timer.js' );

/** Contract: Attributes supports object and Map lifecycles without changing defaults. */
test( 'Attributes supports object and Map lifecycles without changing defaults', () => {
	const attributes = new Attributes( new Map( [ [ 'one', 1 ] ] ) );

	assert.equal( attributes.get( 'one' ), 1 );
	assert.equal( attributes.set( 'two', 2 ), attributes.modified );
	assert.equal( attributes.merge( new Map( [ [ 'three', 3 ] ] ) ), attributes );
	assert.deepEqual( [ ...attributes.modified ], [ [ 'one', 1 ], [ 'two', 2 ], [ 'three', 3 ] ] );
	assert.equal( attributes.clear(), undefined );
	assert.equal( attributes.modified.size, 0 );
	assert.equal( attributes.reset(), attributes );
	assert.deepEqual( [ ...attributes.modified ], [ [ 'one', 1 ] ] );
} );

/** Contract: Entity owns reusable type, state, and unique collection membership without spatial behavior. */
test( 'Entity manages non-spatial state and collection membership', () => {
	const first = [];
	const second = [];
	const entity = new Entity( first, 'actor', 'active' );
	const inert = new Entity();
	const sibling = {};
	const lifecycle = [];

	assert.equal( Abstractions.Entity, Entity );
	assert.equal( inert.destroy(), true );
	assert.equal( first[ 0 ], entity );
	assert.deepEqual( [ entity.type, entity.state ], [ 'actor', 'active' ] );
	assert.equal( 'physics' in entity, false );
	assert.equal( entity.add( sibling ), first );
	assert.equal( entity.add( sibling ), first );
	assert.equal( first.filter( item => item === sibling ).length, 1 );
	assert.equal( entity.remove(), true );
	assert.deepEqual( first, [ sibling ] );
	assert.equal( entity.remove( sibling ), true );
	assert.equal( entity.remove( sibling ), false );
	entity.added = item => lifecycle.push( [ 'added', item ] );
	entity.destroying = () => lifecycle.push( [ 'destroying', entity.group.includes( entity ) ] );
	entity.destroyed = () => lifecycle.push( [ 'destroyed', entity.group.includes( entity ) ] );
	assert.equal( entity.set( second, 'effect', 'idle' ), entity );
	assert.equal( first.includes( entity ), false );
	assert.equal( second[ 0 ], entity );
	assert.deepEqual( lifecycle, [ [ 'added', entity ] ] );
	assert.equal( entity.reset(), entity );
	assert.equal( second.includes( entity ), false );
	assert.deepEqual( [ entity.group, entity.type, entity.state ], [ [], 'default', 'static' ] );
	assert.equal( entity.destroy(), false );
	assert.equal( entity.set( null ), entity );
	assert.deepEqual( entity.group, [ entity ] );
	const owning = entity.group;
	assert.equal( entity.destroy(), true );
	assert.equal( entity.group, owning );
	assert.deepEqual( owning, [] );
	assert.deepEqual( lifecycle.map( event => event[ 0 ] ), [ 'added', 'added', 'destroying', 'destroyed' ] );
	assert.deepEqual( lifecycle.slice( -2 ).map( event => event[ 1 ] ), [ true, false ] );
	assert.equal( entity.destroy(), false );
	assert.equal( lifecycle.length, 4 );
} );

/** Contract: Entity destruction locates membership once and removes it without changing collection association. */
test( 'Entity destroys collection membership with one lookup', () => {
	const group = [];
	const sibling = {};
	let searches = 0;
	const includes = group.includes.bind( group );
	const indexOf = group.indexOf.bind( group );

	group.includes = ( ...args ) => {
		searches++;

		return includes( ...args );
	};
	group.indexOf = ( ...args ) => {
		searches++;

		return indexOf( ...args );
	};

	const entity = new Entity( group );

	group.push( sibling );
	searches = 0;

	assert.equal( entity.destroy(), true );
	assert.equal( searches, 1 );
	assert.equal( entity.group, group );
	assert.equal( group[ 0 ], sibling );
} );

/** Contract: Generic forwards attribute operations and exposes safe lifecycle defaults. */
test( 'Generic forwards attribute operations and exposes safe lifecycle defaults', () => {
	const generic = new Generic( { one: 1 } );

	assert.equal( generic.set( 'two', 2 ), generic.attributes.modified );
	assert.equal( generic.get( 'two' ), 2 );
	assert.equal( generic.merge( { three: 3 } ), generic.attributes );
	assert.equal( generic.reset(), generic.attributes );
	assert.equal( generic.resize(), undefined );
	assert.equal( generic.tick(), undefined );
	assert.equal( generic.update(), undefined );
	assert.equal( generic.render(), undefined );
	assert.equal( generic.destroy(), true );
} );

/** Contract: Buffer covers resizing, scaling, drawing, reading, clearing, and destruction. */
test( 'Buffer covers resizing, scaling, drawing, reading, clearing, and destruction', () => {
	const defaults = new Buffer();
	const buffer = new Buffer( { w: 10, h: 5, d: 1 } );
	const target = new Buffer( { w: 20, h: 10, d: 1 } );
	const originalCanvas = buffer.canvas;

	assert.deepEqual( defaults.size, { w: 0, h: 0, d: 0 } );
	assert.deepEqual( defaults.scale, { x: 1, y: 1, z: 1 } );
	assert.equal( buffer.resize( { w: 10, h: 5, d: 1 } ), undefined );
	assert.equal( buffer.rescale( { x: 1, y: 1, z: 1 } ), undefined );
	assert.equal( buffer.rescale( { x: 2, y: 3, z: 1 } ), buffer );
	assert.deepEqual( buffer.canvas.transform, [ 4, 0, 0, 6, 0, 0 ] );
	assert.equal( buffer.resmooth( true ), buffer );
	assert.equal( buffer.context.imageSmoothingEnabled, true );
	assert.equal( buffer.tick(), undefined );
	assert.equal( buffer.render(), undefined );

	buffer.rect( '#123', { x: 1.9, y: 2.8 }, { w: 3.7, h: 4.6 }, 0.5 );
	assert.deepEqual( buffer.canvas.fillRectArgs, [ 1, 2, 3, 4 ] );
	assert.equal( buffer.context.fillStyle, '#123' );
	assert.equal( buffer.context.globalAlpha, 0.5 );

	buffer.open();
	buffer.text( 'hello', { x: 3, y: 4 }, '#fff', '12px serif', 0.75 );
	buffer.close();
	assert.equal( buffer.canvas.saved, 1 );
	assert.equal( buffer.canvas.restored, 1 );
	assert.deepEqual( buffer.canvas.fillTextArgs, [ 'hello', 3, 4 ] );
	assert.equal( buffer.context.font, '12px serif' );

	assert.ok( buffer.get().data instanceof Uint8ClampedArray );
	assert.deepEqual( buffer.canvas.getImageDataArgs, [ 0, 0, 20, 10 ] );
	buffer.put( target, { x: 7, y: 8 } );
	assert.deepEqual( target.canvas.drawImageArgs, [ originalCanvas, 7, 8, 10, 5 ] );
	buffer.update();
	assert.deepEqual( buffer.canvas.clearRectArgs, [ 0, 0, 20, 10 ] );
	buffer.destroy();
	assert.equal( buffer.canvas.removed, true );
	defaults.destroy();
} );

/** Contract: Layer caches ordered Room pixels until its source, viewport, or Camera changes. */
test( 'Layer owns buffered presentation and explicit invalidation', t => {
	const output = new Buffer( { w: 320, h: 240, d: 1 } );
	const room = {
		buffer:    output,
		tiles:     { items: [] },
		viewpoint: { x: 0, y: 0, z: 0 },
	};
	const groups = [ room.tiles.items ];
	const layer = new Layer( room, 'test', groups );
	let renders = 0;
	let composites = 0;

	room.tiles.items.push( {
		render: () => {
			renders++;
			room.buffer.rect( '#123', { x: 0, y: 0 }, { w: 1, h: 1 } );
		},
	} );
	output.context.drawImage = () => composites++;
	groups.push( 'external-change' );

	assert.deepEqual( layer.children, [ room.tiles.items ] );
	assert.equal( layer.has( room.tiles.items ), true );
	assert.equal( layer.has( [] ), false );
	assert.equal( layer.resize( output.size ), layer );
	assert.equal( layer.render(), layer );
	assert.equal( layer.render(), layer );
	assert.deepEqual( [ renders, composites ], [ 1, 2 ] );
	assert.equal( layer.cache.valid(), true );

	room.viewpoint.x = 1;
	assert.equal( layer.stale(), true );
	assert.equal( layer.cache.reason, 'viewpoint' );
	assert.equal( layer.rebuild(), layer );
	assert.equal( layer.cache.valid(), true );
	assert.equal( renders, 2 );

	layer.invalidate( 'tile changed' );
	layer.render();
	assert.equal( renders, 3 );
	assert.equal( layer.cache.reason, 'tile changed' );

	layer.cached = false;
	layer.render();
	layer.render();
	assert.equal( renders, 5 );

	const canvas = layer.buffer.canvas;
	assert.equal( layer.reset(), layer );
	assert.equal( canvas.removed, true );
	assert.equal( layer.parent, null );
	assert.deepEqual( layer.children, [] );
	assert.equal( layer.render(), layer );
	assert.equal( layer.rebuild(), layer );
	layer.destroy();
	assert.equal( layer.parent, null );
} );

/** Contract: Layers accept nonvisual content and direct screen-space rendering without a canvas. */
test( 'Layer supports a generic parent and optional presentation', () => {
	const parent = { buffer: new Buffer( { w: 20, h: 20 } ) };
	let renders = 0;
	const contents = [ {}, null, { render: 1 }, { render: () => renders++ } ];
	const layer = new Layer( parent, 'overlay', [ contents ], false, false );
	layer.resize( parent.buffer.size );
	layer.render();
	assert.equal( renders, 1 );
	assert.equal( layer.buffer, null );
	layer.visible = false;
	layer.render();
	assert.equal( renders, 1 );
	assert.equal( contents.length, 4 );
	layer.destroy();
	layer.destroy();
	assert.equal( contents.length, 4 );
	parent.buffer.destroy();
} );

/** Contract: Failed Layer builds restore the parent and cannot validate partial output. */
test( 'Layer restores its parent after a rendering failure', () => {
	const parent = { buffer: new Buffer( { w: 20, h: 20 } ) };
	const output = parent.buffer;
	const contents = [];
	const layer = new Layer( parent, 'overlay', [ contents ] );
	layer.render();
	assert.equal( layer.cache.valid(), true );
	contents.push( { render: () => { throw new Error( 'drawing failed' ); } } );
	assert.throws( () => layer.rebuild(), /drawing failed/ );
	assert.equal( parent.buffer, output );
	assert.equal( layer.cache.stale(), true );
	contents.length = 0;
	contents.push( { render: () => layer.invalidate() } );
	layer.rebuild();
	assert.equal( layer.cache.stale(), true );
	layer.destroy();
	output.destroy();
} );

/** Contract: Screen converts units and manages DPR-backed canvas state and listeners. */
test( 'Screen converts units and manages DPR-backed canvas state and listeners', () => {
	const originalMatchMedia = window.matchMedia;
	const calls = [];

	window.matchMedia = query => ( {
		query,
		addEventListener: ( ...args ) => calls.push( [ 'add', ...args ] ),
		removeEventListener: ( ...args ) => calls.push( [ 'remove', ...args ] ),
	} );

	const screen = new Screen();
	const canvas = { width: 0, height: 0 };
	const context = { scale: ( ...args ) => calls.push( [ 'scale', ...args ] ) };

	assert.equal( screen.getDpr( 3 ), 2 );
	screen.setDpr( 2 );
	assert.equal( screen.px( 3 ), 6 );
	assert.equal( screen.unpx( 6 ), 3 );
	assert.equal( screen.unit( 2 ), 64 );
	assert.equal( screen.world( 64 ), 2 );
	screen.rescale( context, { x: 2, y: 3 } );
	assert.deepEqual( calls.at( -1 ), [ 'scale', 4, 6 ] );
	assert.equal( screen.font( '10px serif' ), '20px serif' );
	assert.equal( screen.font( 'serif' ), 'serif' );
	screen.resize( canvas, { w: 4.9, h: 5.9, d: 2 } );
	assert.deepEqual( canvas, { width: 9, height: 11 } );
	assert.deepEqual( screen.pixel, { w: 9, h: 11, d: 2 } );
	assert.equal( screen.width(), 4.9 );
	assert.equal( screen.height(), 5.9 );

	screen.change();
	assert.ok( calls.some( call => call[ 0 ] === 'remove' ) );
	assert.ok( calls.some( call => call[ 0 ] === 'add' ) );
	screen.ignore();
	assert.equal( screen.match, null );
	window.matchMedia = originalMatchMedia;
} );

/** Contract: Device supplies defaults, overrides, disabled mappings, and neutral input. */
test( 'Device supplies defaults, overrides, disabled mappings, and neutral input', () => {
	class TestDevice extends Device {
		static defaults = { jump: [ 'A' ], disabled: [ 'B' ] };
	}

	const device = new TestDevice();
	device.overrides = () => ( { jump: [ 'X' ], disabled: false } );

	assert.equal( device.name(), 'TestDevice' );
	assert.deepEqual( device.defaults(), TestDevice.defaults );
	assert.deepEqual( device.actions(), { jump: [ 'X' ], disabled: [] } );
	assert.equal( device.set(), device );
	assert.equal( device.tick(), undefined );
	assert.equal( device.pressed( 'jump' ), false );
	assert.deepEqual( device.axes(), [ 0, 0 ] );
} );

/** Contract: Inputs polls every device and chooses the first active axis pair. */
test( 'Inputs polls every device and chooses the first active axis pair', () => {
	const inputs = new Inputs();
	const calls = [];
	inputs.devices = [
		{ tick: () => calls.push( 1 ), pressed: () => false, axes: () => [ 0, 0 ] },
		{ tick: () => calls.push( 2 ), pressed: action => action === 'jump', axes: () => [ 1, -1 ] },
	];

	inputs.tick();
	assert.deepEqual( calls, [ 1, 2 ] );
	assert.equal( inputs.pressed( 'jump' ), true );
	assert.equal( inputs.pressed( 'duck' ), false );
	assert.deepEqual( inputs.axes(), [ 1, -1 ] );
	inputs.devices[ 1 ].axes = () => null;
	assert.deepEqual( inputs.axes(), [ 0, 0 ] );

	Game.Hooks.reset();
	inputs.hooks();
	assert.equal( Game.Hooks.exists( 'Frame.tick', inputs.tick ), true );
} );

/** Contract: Clock tracks shared time and formats padded and unpadded tokens. */
test( 'Clock tracks shared time and formats padded and unpadded tokens', () => {
	const originalNow = Time.now;
	Time.now = 100;
	const clock = new Clock();

	Time.now = 3723104;
	clock.tick();
	assert.equal( clock.times.elapsed, 3723004 );
	assert.equal( clock.elapsed(), '01:02:03.004' );
	assert.equal( clock.elapsed( 'h:m:s.SS' ), '1:2:3.00' );
	assert.equal( clock.elapsed( 'plain' ), undefined );
	Game.Hooks.reset();
	clock.hooks();
	assert.equal( Game.Hooks.exists( 'Frame.tick', clock.tick ), true );
	Time.now = originalNow;
} );

/** Contract: View owns its DOM buffer, forwards lifecycle hooks, and centers rectangles. */
test( 'View owns its DOM buffer, forwards lifecycle hooks, and centers rectangles', () => {
	const view = new View();

	assert.equal( view.wrapper.children.includes( view.canvas ), true );
	view.resize();
	assert.deepEqual( view.buffer.size, { w: 1280, h: 720, d: 1 } );
	Game.Hooks.reset();
	view.hooks();
	assert.equal( Game.Hooks.exists( 'Frame.tick', view.tick ), true );
	assert.equal( Game.Hooks.exists( 'View.update', view.buffer.update ), true );
	assert.equal( view.tick(), undefined );
	assert.equal( view.update(), undefined );
	assert.equal( view.render(), undefined );
	const centered = view.center(
		{ x: 10, y: 20, z: 30 },
		{ w: 20, h: 30, d: 40 },
		{ w: 10, h: 10, d: 10 },
		false
	);
	assert.deepEqual( [ centered.x, centered.y, centered.z ], [ 15, 30, 45 ] );
} );

/** Contract: Camera centers valid targets, skips invalid state, and registers its hooks. */
test( 'Camera centers valid targets, skips invalid state, and registers its hooks', () => {
	const camera = new Camera();
	const prior = { x: 1, y: 2 };
	camera.position = prior;
	assert.equal( camera.center(), undefined );
	camera.target = { physics: { position: { x: 10, y: Number.NaN, z: 0 }, size: { w: 2, h: 2, d: 1 } } };
	camera.view = { size: { w: 6, h: 6, d: 1 } };
	assert.equal( camera.center(), undefined );
	assert.equal( camera.position, prior );
	camera.target.physics.position.y = 20;
	camera.center();
	assert.deepEqual( [ camera.position.x, camera.position.y ], [ 8, 18 ] );
	Game.Hooks.reset();
	camera.hooks();
	camera.target = { physics: { position: { x: 10, y: 20, z: 0 }, size: { w: 2, h: 2, d: 1 } } };
	camera.view = { size: { w: 6, h: 6, d: 1 } };
	camera.room = { size: { w: 100, h: 100, d: 1 } };
	assert.equal( Game.Hooks.exists( 'Camera.update', camera.center ), true );
	camera.update();
} );

/** Contract: Frame lifecycle, measurement, clamping, smoothing, and visibility remain bounded. */
test( 'Frame lifecycle, measurement, clamping, smoothing, and visibility remain bounded', () => {
	const frame = new Frame();
	const originalHidden = document.hidden;
	Game.Hooks.reset();
	frame.hooks();
	assert.equal( Game.Hooks.exists( 'Frame.animate', frame.tick, 2 ), true );
	frame.tick();
	frame.update();
	frame.render();
	frame.history = [ 0 ];
	assert.equal( frame.diff(), 1 );
	frame.history = [ 0, 20 ];
	assert.equal( frame.diff(), 1.2 );
	Time.delta = 0;
	assert.equal( frame.rawDiff(), 1 );
	Time.delta = 1;
	assert.equal( frame.rawDiff(), frame.settings.throttle );
	Time.delta = 1000;
	assert.equal( frame.rawDiff(), frame.settings.clamp );
	frame.ema = 1;
	Time.diff = 3;
	assert.equal( frame.emaDiff( 0.5 ), 2 );
	frame.history = [ Time.now - 2000, Time.now ];
	const history = frame.history;
	frame.counter();
	assert.equal( frame.history, history );
	assert.ok( frame.history.every( value => value > Time.now - frame.settings.second ) );

	document.hidden = true;
	frame.visibility();
	assert.equal( frame.paused, true );
	document.hidden = false;
	frame.visibility();
	assert.equal( frame.paused, false );
	assert.equal( frame.scheduled, true );
	document.hidden = originalHidden;
	frame.cancel();
} );

/** Contract: HUD samples game state, draws labels, and respects its visibility setting. */
test( 'HUD samples game state, draws labels, and respects its visibility setting', t => {
	const hud = new Hud();
	const originalRoom = Game.Room;
	const originalClock = Game.Clock;
	const originalFrame = Game.Frame;
	const originalView = Game.View;
	const originalNow = Time.now;
	t.after( () => {
		Game.Room = originalRoom;
		Game.Clock = originalClock;
		Game.Frame = originalFrame;
		Game.View = originalView;
		Time.now = originalNow;
	} );
	Game.Room = { id: 3, tiles: { players: [ {} ] } };
	Game.Clock = { elapsed: () => '00:01' };
	Game.Frame = { fps: () => 59 };
	Game.View = { buffer: new Buffer( { w: 100, h: 100, d: 1 } ) };
	Time.now = hud.flast + 501;
	hud.tick();
	assert.deepEqual( [ hud.room, hud.time, hud.frames ], [ 3, '00:01', 59 ] );
	hud.update();
	assert.equal( hud.buffer.canvas.fillTextArgs[ 0 ], '🎥 59' );
	hud.render();
	assert.equal( Game.View.buffer.canvas.drawImageArgs[ 0 ], hud.buffer.canvas );
	Game.Hooks.reset();
	hud.hooks();
	assert.equal( Game.Hooks.exists( 'View.render', hud.render ), true );
} );

/** Contract: History records presses, holds, releases, filtering, and bounded events. */
test( 'History records presses, holds, releases, filtering, and bounded events', () => {
	const history = new History();
	const originalInputs = Game.Inputs;
	let down = true;
	Game.Inputs = {
		devices: [ { map: { jump: [] } }, { map: { left: [] } } ],
		pressed: action => action === 'jump' && down,
	};
	Time.now = 100;
	history.tick();
	assert.equal( history.edge( 'jump' ), true );
	Time.now = 125;
	history.tick();
	assert.equal( history.held( 'jump', 25 ), true );
	down = false;
	Time.now = 130;
	history.tick();
	assert.equal( history.released( 'jump' ), true );
	assert.equal( history.hold( 'jump' ).duration, 30 );
	assert.equal( history.presses( 'jump' ), 1 );
	assert.equal( history.recent( { type: 'release', window: 1 } ).length, 1 );
	history.settings = { max: 1 };
	history.pushEvent( { action: 'left', type: 'press', time: 130 } );
	assert.equal( history.events.length, 1 );
	assert.equal( history.held( 'missing' ), false );
	assert.equal( history.released( 'missing' ), false );
	Game.Hooks.reset();
	history.hooks();
	assert.equal( Game.Hooks.exists( 'Frame.tick', history.tick, 11 ), true );
	Game.Inputs = originalInputs;
} );

/** Contract: Combos match ordered presses, enforce windows and cooldowns, and trigger hooks. */
test( 'Combos match ordered presses, enforce windows and cooldowns, and trigger hooks', () => {
	const combos = new Combos();
	const originalHistory = Game.History;
	const triggered = [];
	Game.History = {
		events: [
			{ action: 'left', type: 'press', time: 80 },
			{ action: 'noop', type: 'release', time: 85 },
			{ action: 'left', type: 'press', time: 90 },
		],
	};
	Time.now = 100;
	assert.equal( combos.matched( [ 'left', 'left' ], 30 ), true );
	assert.equal( combos.matched( [ 'right' ], 30 ), false );
	assert.equal( combos.matched( [ 'left' ], 5 ), false );
	combos.combos = {
		empty: { sequence: [] },
		dash: { sequence: [ 'left', 'left' ], window: 30 },
	};
	Game.Hooks.reset();
	Game.Hooks.add( 'Combo.trigger', ( name, data ) => triggered.push( [ name, data ] ) );
	combos.tick();
	combos.tick();
	assert.equal( triggered.length, 1 );
	assert.equal( triggered[ 0 ][ 0 ], 'dash' );
	combos.hooks();
	assert.equal( Game.Hooks.exists( 'Frame.tick', combos.tick, 12 ), true );
	Game.History = originalHistory;
} );

/** Contract: Jobs validates callbacks, runs immediate jobs, and survives callback errors. */
test( 'Jobs validates callbacks, runs immediate jobs, and survives callback errors', () => {
	const jobs = new Jobs();
	const calls = [];
	assert.equal( jobs.schedule( null ), false );
	jobs.schedule( value => calls.push( value ), { args: [ 42 ], key: 'once' } );
	jobs.schedule( () => {
		throw new Error( 'expected' );
	} );
	jobs.tick();
	assert.deepEqual( calls, [ 42 ] );
	assert.equal( jobs.hasKey( 'once' ), false );
	assert.equal( jobs.cancelKey( 'missing' ), 0 );
	jobs.cleanupKey( {} );
	Game.Hooks.reset();
	jobs.hooks();
	assert.equal( Game.Hooks.exists( 'Frame.tick', jobs.tick, 20 ), true );
} );

/** Contract: Timer covers aliases, boundaries, pause expiry, repeat, extension, and reduction. */
test( 'Timer covers aliases, boundaries, pause expiry, repeat, extension, and reduction', () => {
	Time.now = 100;
	const timer = new Timer();
	assert.equal( timer.elapsed(), 0 );
	assert.equal( timer.ratio(), 0 );
	assert.equal( timer.start( 50 ), timer );
	assert.equal( timer.active(), true );
	assert.equal( timer.remain(), 50 );
	assert.equal( timer.extend( 10 ).duration, 60 );
	assert.equal( timer.reduce( 10 ).duration, 50 );
	assert.equal( timer.extend( 0 ), timer );
	assert.equal( timer.reduce( 0 ), timer );
	Time.now = 200;
	assert.equal( timer.done(), true );
	assert.equal( timer.extend( 25 ).duration, 25 );
	timer.repeat( 10 );
	Time.now = timer.expiresAt;
	assert.equal( timer.ping(), true );
	assert.equal( timer.ping(), false );
	timer.pause();
	timer.remains = 0;
	timer.resume();
	assert.equal( timer.duration, 0 );
	assert.equal( timer.shift( 0 ), timer );
	assert.equal( timer.shift( 5 ), timer );
	assert.equal( timer.stop(), timer );
} );

/** Contract: The browser test environment captures registered global listeners. */
test( 'The browser test environment captures registered global listeners', () => {
	assert.ok( browser.listeners.has( 'visibilitychange' ) );
} );

/** Contract: Entity reports successful removals before changing groups and preserves destruction ordering. */
test( 'Entity notifies removal across its lifecycle', () => {
	const group = [];
	const entity = new Entity( group );
	const events = [];
	entity.removed = item => events.push( [ item, entity.group, entity.group.includes( item ) ] );
	assert.equal( entity.remove( {} ), false );
	assert.equal( events.length, 0 );
	entity.reset( [] );
	assert.deepEqual( events, [ [ entity, group, false ] ] );
	entity.set( group );
	entity.destroyed = () => events.push( 'destroyed' );
	entity.destroy();
	assert.deepEqual( events.slice( 1 ), [ [ entity, group, false ], 'destroyed' ] );
	assert.equal( entity.destroy(), false );
	assert.equal( events.length, 3 );
} );

/** Contract: Layer defers additions, skips removed members, visits survivors, and rejects changed cached output. */
test( 'Layer handles membership changes during rendering', () => {
	for ( const buffered of [ true, false ] ) {
		const parent = { buffer: new Buffer() };
		const group = [];
		const calls = [];
		const first = new Entity( group );
		const removed = new Entity( group );
		const survivor = new Entity( group );
		const added = { render: () => calls.push( 'added' ) };
		first.render = () => {
			calls.push( 'first' );
			first.remove();
			removed.remove();
			group.push( added );
		};
		removed.render = () => calls.push( 'removed' );
		survivor.render = () => calls.push( 'survivor' );
		const layer = new Layer( parent, 'test', [ group ], true, buffered );
		layer.render();
		assert.deepEqual( calls, [ 'first', 'survivor' ] );
		assert.equal( layer.cache.stale(), true );
		assert.equal( layer.cache.reason, 'membership' );
		calls.length = 0;
		layer.render();
		assert.deepEqual( calls, [ 'survivor', 'added' ] );
		assert.equal( layer.cache.valid(), buffered );
		layer.destroy();
		parent.buffer.screen.ignore();
		parent.buffer.destroy();
	}
} );
