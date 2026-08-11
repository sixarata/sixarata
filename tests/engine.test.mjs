import assert from 'node:assert/strict';
import test from 'node:test';

import { installBrowserEnvironment } from './helpers/browser.mjs';

installBrowserEnvironment();

const { default: Game } = await import( '../scripts/core/game.js' );
const { default: Buffer } = await import( '../scripts/core/components/buffer.js' );
const { default: Gamepad } = await import( '../scripts/core/inputs/gamepad.js' );
const { default: Keyboard } = await import( '../scripts/core/inputs/keyboard.js' );
const { default: Jobs } = await import( '../scripts/core/utilities/jobs.js' );
const { default: Time } = await import( '../scripts/core/utilities/time.js' );

test( 'Game boots without enabling fluid simulations', () => {
	assert.ok( Game.Gravity );
	assert.ok( Game.Damping );
	assert.equal( Game.Fluid, undefined );
	assert.equal( Game.Smoke, undefined );
	assert.equal( Game.Fluids, undefined );
} );

test( 'Buffer keeps a DPR-scaled backing store and logical transform', () => {
	const buffer = new Buffer( { w: 100, h: 50, d: 1 } );

	assert.equal( buffer.canvas.width, 200 );
	assert.equal( buffer.canvas.height, 100 );
	assert.deepEqual( buffer.canvas.transform, [ 2, 0, 0, 2, 0, 0 ] );
} );

test( 'Buffer composites DPR backing stores at logical dimensions', () => {
	const source = new Buffer( { w: 100, h: 50, d: 1 } );
	const target = new Buffer( { w: 200, h: 100, d: 1 } );

	source.put( target );

	assert.deepEqual(
		target.canvas.drawImageArgs.slice( 1 ),
		[ 0, 0, 100, 50 ]
	);
} );

test( 'Keyboard maps physical keys to logical actions', () => {
	const keyboard = new Keyboard();

	keyboard.keyDown( { code: 'ArrowLeft' } );
	assert.equal( keyboard.pressed( 'left' ), true );
	assert.deepEqual( keyboard.axes(), [ -1, 0 ] );
	keyboard.keyUp( { code: 'ArrowLeft' } );
	assert.equal( keyboard.pressed( 'left' ), false );
} );

test( 'Gamepad maps axes and buttons to logical actions', () => {
	const gamepad = new Gamepad();
	gamepad.state = {
		0: {
			axes: [ 0.75, -0.75 ],
			buttons: [ true ],
		},
	};

	assert.equal( gamepad.pressed( 'right' ), true );
	assert.equal( gamepad.pressed( 'up' ), true );
	assert.equal( gamepad.pressed( 'jump' ), true );
	assert.deepEqual( gamepad.axes(), [ 0.75, -0.75 ] );
} );

test( 'Jobs respect time and frame delays', () => {
	const jobs = new Jobs();
	const calls = [];

	Game.Clock.times.elapsed = 0;
	jobs.schedule( () => calls.push( 'time' ), { ms: 100 } );
	jobs.schedule( () => calls.push( 'frame' ), { frames: 2 } );
	jobs.tick();
	assert.deepEqual( calls, [] );
	Game.Clock.times.elapsed = 50;
	jobs.tick();
	assert.deepEqual( calls, [ 'frame' ] );
	Game.Clock.times.elapsed = 100;
	jobs.tick();
	assert.deepEqual( calls, [ 'frame', 'time' ] );
} );

test( 'Jobs repeat, cancel, and clean keyed indexes', () => {
	const jobs = new Jobs();
	let calls = 0;

	Game.Clock.times.elapsed = 0;
	const repeating = jobs.schedule( () => calls++, {
		frames: 2,
		repeat: true,
		key: 'heartbeat',
	} );
	const cancelled = jobs.schedule( () => calls += 100, {
		frames: 1,
		key: 'cancelled',
	} );

	assert.equal( jobs.hasKey( 'heartbeat' ), true );
	assert.equal( jobs.cancel( cancelled ), true );
	jobs.tick();
	jobs.tick();
	jobs.tick();
	jobs.tick();

	assert.equal( calls, 2 );
	assert.equal( jobs.hasKey( 'cancelled' ), false );
	assert.equal( jobs.cancelKey( 'heartbeat' ), 1 );
	jobs.tick();
	assert.equal( jobs.hasKey( 'heartbeat' ), false );
	assert.equal( jobs.cancel( repeating ), false );
} );

test( 'Room parsing supports ragged rows and cleans old player hooks', () => {
	Game.Hooks.reset();
	Game.Room.reset();
	Game.Room.hooks();
	Game.Room.rooms = [
		[
			'P G',
			'xxxxx',
		],
		[
			'B',
			'xxxxx',
		],
	];

	Game.Room.load( 0 );
	const previousPlayer = Game.Room.tiles.players[ 0 ];
	assert.equal( Game.Room.size.w, 160 );
	assert.equal( Game.Room.tiles.platforms.length, 5 );
	assert.equal( Game.Hooks.exists( 'Combo.trigger', previousPlayer.mechanics.dash.combo ), true );

	Game.Room.load( 1 );
	assert.equal( Game.Room.tiles.players.length, 1 );
	assert.equal( Game.Hooks.exists( 'Combo.trigger', previousPlayer.mechanics.dash.combo ), false );
	assert.equal( Game.Hooks.exists( 'Tile.render', previousPlayer.mechanics.collide.render ), false );
} );

test( 'Player moved helper follows unified input axes', () => {
	const player = Game.Room.tiles.players[ 0 ];
	const originalAxes = Game.Inputs.axes;

	Game.Inputs.axes = () => [ 0, 0 ];
	assert.equal( player.moved(), false );
	Game.Inputs.axes = () => [ 1, 0 ];
	assert.equal( player.moved(), true );
	Game.Inputs.axes = originalAxes;
} );

test( 'Player movement uses elapsed seconds without consulting DPR', () => {
	const player = Game.Room.tiles.players[ 0 ];
	const originalListen = player.mechanics.collide.listen;
	const originalDelta = Time.delta;
	const originalDpr = Game.Screen.dpr;
	const start = player.physics.position.x;
	const positions = [];

	player.mechanics.collide.listen = () => {};
	player.physics.velocity.set( 120, 0, 0 );
	Time.delta = 1000 / 60;

	for ( const dpr of [ 1, 2, 3 ] ) {
		Game.Screen.dpr = dpr;
		player.physics.position.x = start;
		player.reposition();
		positions.push( player.physics.position.x );
	}

	assert.deepEqual( positions, [ start + 2, start + 2, start + 2 ] );

	player.mechanics.collide.listen = originalListen;
	player.physics.velocity.reset();
	Time.delta = originalDelta;
	Game.Screen.dpr = originalDpr;
} );

test( 'Held movement input produces velocity and translation at 120 Hz', () => {
	const player = Game.Room.tiles.players[ 0 ];
	const originalListen = player.mechanics.collide.listen;
	const originalDelta = Time.delta;
	const originalLeft = Game.History.state.left;
	const originalRight = Game.History.state.right;
	const start = player.physics.position.x;

	player.mechanics.collide.listen = () => {};
	player.physics.velocity.reset();
	Game.History.state.left = { down: false, duration: 0 };
	Game.History.state.right = { down: true, duration: 120 };
	Time.delta = 1000 / 120;

	player.respond();
	player.reposition();

	assert.equal( player.physics.velocity.x, 480 );
	assert.equal( player.physics.position.x, start + 4 );

	player.mechanics.collide.listen = originalListen;
	player.physics.velocity.reset();
	player.physics.position.x = start;
	Game.History.state.left = originalLeft;
	Game.History.state.right = originalRight;
	Time.delta = originalDelta;
} );

test( 'Sustained locomotion covers the same distance at 30, 60, and 120 Hz', () => {
	const player = Game.Room.tiles.players[ 0 ];
	const originalListen = player.mechanics.collide.listen;
	const originalDelta = Time.delta;
	const originalLeft = Game.History.state.left;
	const originalRight = Game.History.state.right;
	const start = player.physics.position.x;
	const distances = [];

	player.mechanics.collide.listen = () => {};
	Game.History.state.left = { down: false, duration: 0 };
	Game.History.state.right = { down: true, duration: 120 };

	for ( const rate of [ 30, 60, 120 ] ) {
		player.physics.position.x = start;
		player.physics.velocity.reset();
		Time.delta = 1000 / rate;

		for ( let frame = 0; frame < rate; frame++ ) {
			player.respond();
			player.reposition();
		}

		distances.push( player.physics.position.x - start );
	}

	assert.ok( distances.every(
		distance => Math.abs( distance - distances[ 0 ] ) < 0.000001
	) );
	assert.ok( Math.abs( distances[ 0 ] - 480 ) < 0.000001 );

	player.mechanics.collide.listen = originalListen;
	player.physics.velocity.reset();
	player.physics.position.x = start;
	Game.History.state.left = originalLeft;
	Game.History.state.right = originalRight;
	Time.delta = originalDelta;
} );

test( 'Jump applies a conventional upward velocity impulse', () => {
	const player = Game.Room.tiles.players[ 0 ];
	const jump = player.mechanics.jump;
	const originalCount = jump.count;

	player.physics.velocity.reset();
	jump.count = 0;
	jump.do();

	assert.equal( player.physics.velocity.y, -480 );
	assert.equal( jump.count, 1 );

	player.physics.velocity.reset();
	jump.count = originalCount;
} );

test( 'Gravity reaches the same terminal velocity at 30, 60, and 120 Hz', () => {
	const player = Game.Room.tiles.players[ 0 ];
	const fall = player.mechanics.fall;
	const originalDelta = Time.delta;
	const originalBottom = player.physics.contact.bottom;
	const velocities = [];

	player.physics.contact.bottom = false;

	for ( const rate of [ 30, 60, 120 ] ) {
		player.physics.velocity.reset();
		Time.delta = 1000 / rate;

		for ( let frame = 0; frame < rate; frame++ ) {
			fall.listen();
		}

		velocities.push( player.physics.velocity.y );
	}

	assert.deepEqual( velocities, [ 480, 480, 480 ] );

	player.physics.velocity.reset();
	player.physics.contact.bottom = originalBottom;
	Time.delta = originalDelta;
} );

test( 'Idle velocity damping is equivalent at 30, 60, and 120 Hz', () => {
	const player = Game.Room.tiles.players[ 0 ];
	const decay = player.mechanics.walk.decay;
	const originalDelta = Time.delta;
	const originalLeft = Game.History.state.left;
	const originalRight = Game.History.state.right;
	const velocities = [];

	Game.History.state.left = { down: false, duration: 0 };
	Game.History.state.right = { down: false, duration: 0 };

	for ( const rate of [ 30, 60, 120 ] ) {
		player.physics.velocity.set( 1e15, 0, 0 );
		Time.delta = 1000 / rate;

		for ( let frame = 0; frame < rate; frame++ ) {
			decay.listen();
		}

		velocities.push( player.physics.velocity.x );
	}

	assert.ok( velocities.every(
		velocity => Math.abs( velocity - velocities[ 0 ] ) < 0.000001
	) );

	player.physics.velocity.reset();
	Game.History.state.left = originalLeft;
	Game.History.state.right = originalRight;
	Time.delta = originalDelta;
} );

test( 'Tile solidity uses a backwards-compatible density alias', () => {
	const player = Game.Room.tiles.players[ 0 ];

	assert.equal( player.solid, true );
	player.density = 0;
	assert.equal( player.solid, false );
	player.solid = true;
	assert.equal( player.density, true );
} );

test( 'Camera bottom-aligns a room smaller than the view', () => {
	Game.Camera.target = { physics: { position: { y: 0 } } };
	Game.Camera.view = { size: { w: 100, h: 100 } };
	Game.Camera.room = { size: { w: 50, h: 50 } };
	Game.Camera.position = { x: 20, y: 20 };
	Game.Camera.limit();

	assert.deepEqual( Game.Camera.position, { x: 0, y: -50 } );
} );

test( 'Camera supports start, center, end, and scrolling alignment', () => {
	assert.equal( Game.Camera.limitAxis( 20, 50, 100, 'left' ), 0 );
	assert.equal( Game.Camera.limitAxis( 20, 50, 100, 'center' ), -25 );
	assert.equal( Game.Camera.limitAxis( 20, 50, 100, 'right' ), -50 );
	assert.equal( Game.Camera.limitAxis( -10, 200, 100, 'center' ), 0 );
	assert.equal( Game.Camera.limitAxis( 120, 200, 100, 'center' ), 100 );
} );

test( 'Frame requests retain the current animation identifier', () => {
	const before = Game.Frame.current;
	const duplicate = Game.Frame.request();

	assert.equal( duplicate, before );

	Game.Frame.cancel();
	const after = Game.Frame.request();

	assert.ok( after > before );
	assert.equal( Game.Frame.current, after );
	assert.ok( Time.now >= 0 );
} );
