import assert from 'node:assert/strict';
import test from 'node:test';

import { installBrowserEnvironment } from './helpers/browser.mjs';

installBrowserEnvironment();

const { default: Game } = await import( '../scripts/core/game.js' );
const { default: Time } = await import( '../scripts/core/utilities/time.js' );
const {
	Brake,
	Collide,
	Coyote,
	Dash,
	Decay,
	Fall,
	Jump,
	MicroTap,
	Nudge,
	Orient,
	Sprint,
	Stamina,
	Walk,
	WallClimb,
	WallGrab,
	WallJump,
	WallSlide,
} = await import( '../scripts/core/mechanics/exports.js' );

const input = (
	holds = {},
	edges = {},
	releases = {}
) => {
	Game.History.hold = action => holds[ action ] ?? { down: false, duration: 0 };
	Game.History.edge = action => Boolean( edges[ action ] );
	Game.History.released = action => Boolean( releases[ action ] );
};

const body = () => ( {
	physics: {
		velocity: { x: 0, y: 0, z: 0 },
		position: { x: 0, y: 0, z: 0 },
		size: { w: 32, h: 32, d: 32 },
		contact: { top: false, right: false, bottom: false, left: false },
		orientation: { x: 90, y: 45, z: 0 },
	},
	mechanics: {},
} );

/** Contract: Fall applies bounded gravity in air and a base force on ground. */
test( 'Fall applies bounded gravity in air and a base force on ground', () => {
	const tile = body();
	const fall = new Fall( tile );
	const originalStep = Time.step;

	Time.step = 10;
	fall.listen();
	assert.ok( tile.physics.velocity.y > 0 );
	tile.physics.velocity.y = fall.settings.terminal + 1;
	fall.listen();
	assert.equal( tile.physics.velocity.y, fall.settings.terminal );
	tile.physics.contact.bottom = true;
	fall.listen();
	assert.equal( fall.doing(), false );
	assert.equal( fall.free(), false );
	Time.step = originalStep;
} );

/** Contract: Jump counts impulses, detects landing, and enforces its configured limit. */
test( 'Jump counts impulses, detects landing, and enforces its configured limit', () => {
	const tile = body();
	const jump = new Jump( tile );
	tile.mechanics.jump = jump;
	input( {}, { jump: true } );

	jump.listen();
	assert.equal( jump.count, 1 );
	assert.equal( tile.physics.velocity.y, -jump.settings.power.min );
	jump.count = jump.settings.count.max;
	assert.equal( jump.maxed(), true );
	assert.equal( jump.can(), false );
	tile.physics.contact.bottom = true;
	assert.equal( jump.landed(), true );
	jump.listen();
	assert.equal( jump.count, 1 );
	tile.physics.contact.bottom = false;
	jump.count = 0;
	assert.equal( jump.freefall(), true );
} );

/** Contract: Coyote starts a grace window after leaving ground and spends it once. */
test( 'Coyote starts a grace window after leaving ground and spends it once', () => {
	const tile = body();
	let jumps = 0;
	tile.mechanics.jump = { count: 0, can: () => false, do: () => jumps++ };
	const coyote = new Coyote( tile );
	const originalPressed = Game.Inputs.pressed;
	Time.now = 100;
	tile.physics.contact.bottom = true;
	coyote.idle();
	tile.physics.contact.bottom = false;
	coyote.idle();
	assert.equal( coyote.can(), true );
	Game.Inputs.pressed = action => action === 'jump';
	coyote.listen();
	assert.equal( jumps, 1 );
	assert.equal( coyote.freefall.active(), false );
	Game.Inputs.pressed = originalPressed;
} );

/** Contract: Horizontal movement stages nudge, ramp, sprint, brake, trim, and decay velocity. */
test( 'Horizontal movement stages cooperate across the complete input lifecycle', () => {
	const tile = body();
	const nudge = new Nudge( tile );
	const walk = new Walk( tile );
	const sprint = new Sprint( tile );
	const brake = new Brake( tile );
	const micro = new MicroTap( tile );
	const decay = new Decay( tile );

	input( {}, { right: true } );
	nudge.listen();
	assert.equal( tile.physics.velocity.x, nudge.settings.base );
	input( { right: { down: true, duration: walk.settings.accel / 2 } } );
	walk.listen();
	assert.ok( tile.physics.velocity.x > walk.settings.base );
	input( { right: { down: true, duration: sprint.settings.runHold } } );
	sprint.listen();
	assert.equal( tile.physics.velocity.x, sprint.settings.run );
	input( {}, { left: true } );
	brake.listen();
	assert.equal( tile.physics.velocity.x, sprint.settings.run * brake.settings.multiplier );
	tile.physics.velocity.x = 100;
	input( { right: { down: false, duration: 1 } }, {}, { right: true } );
	micro.listen();
	assert.equal( tile.physics.velocity.x, 100 * micro.settings.factor );
	Time.step = 1000 / 60;
	input();
	decay.listen();
	assert.equal( tile.physics.velocity.x, 0 );
} );

/** Contract: Orient debounces a requested face change and always flattens vertical orientation. */
test( 'Orient debounces requested face changes', () => {
	const tile = body();
	const orient = new Orient( tile );
	Time.now = 100;
	input( { left: { down: true, duration: orient.settings.debounce } }, { left: true } );
	orient.listen();
	assert.equal( tile.physics.orientation.x, 270 );
	assert.equal( tile.physics.orientation.y, 0 );
	Time.now += 1;
	input( { right: { down: true, duration: 0 } }, { right: true } );
	orient.listen();
	assert.equal( tile.physics.orientation.x, 270 );
} );

/** Contract: Stamina drains, delays, recharges, reports state, and refills safely. */
test( 'Stamina manages a bounded time-based resource', () => {
	const originalStep = Time.step;
	Time.now = 100;
	Time.step = 10;
	const stamina = new Stamina( { max: 100, drain: 2, delay: 20, rate: 3 } );
	stamina.drain();
	assert.equal( stamina.current, 80 );
	assert.equal( stamina.has( 79 ), true );
	assert.equal( stamina.percent(), 0.8 );
	stamina.listen();
	assert.equal( stamina.current, 80 );
	Time.now = 120;
	stamina.listen();
	assert.equal( stamina.current, 100 );
	assert.equal( stamina.full(), true );
	stamina.drain( 200 );
	assert.equal( stamina.depleted(), true );
	stamina.refill();
	assert.equal( stamina.current, 100 );
	assert.equal( new Stamina( { max: 0 } ).percent(), 1 );
	Time.step = originalStep;
} );

/** Contract: Wall grab requires airborne inward input and consumes grip stamina. */
test( 'WallGrab acquires, maintains, and releases wall contact', () => {
	const tile = body();
	const grab = new WallGrab( tile );
	tile.mechanics.wall = { grab, climb: { doing: () => false } };
	tile.physics.contact.left = true;
	tile.physics.velocity.y = 20;
	input( { left: { down: true, duration: 10 } } );
	assert.equal( grab.can(), true );
	grab.listen();
	assert.equal( grab.grabbing, true );
	assert.equal( tile.physics.velocity.y, 0 );
	input();
	grab.listen();
	assert.equal( grab.grabbing, false );
	tile.physics.contact.bottom = true;
	grab.stamina.current = 0;
	grab.listen();
	assert.equal( grab.stamina.full(), true );
} );

/** Contract: Wall climb and slide apply their mutually exclusive vertical motion. */
test( 'WallClimb and WallSlide apply bounded vertical motion', () => {
	const tile = body();
	const grab = { doing: () => true, gripping: () => false };
	tile.mechanics.wall = { grab };
	const climb = new WallClimb( tile );
	input( { up: { down: true, duration: 1 } } );
	assert.equal( climb.doing(), true );
	climb.settings = { ...climb.settings, accel: 0 };
	climb.listen();
	assert.equal( tile.physics.velocity.y, -climb.settings.speed );

	const slide = new WallSlide( tile );
	tile.physics.velocity.y = 0;
	assert.equal( slide.can(), true );
	Time.step = 1000 / 60;
	slide.listen();
	assert.ok( tile.physics.velocity.y > 0 );
	tile.physics.velocity.y = slide.settings.max + 1;
	slide.do();
	assert.equal( tile.physics.velocity.y, slide.settings.max );
} );

/** Contract: Wall jump launches away from contact and restores suspended mechanics. */
test( 'WallJump launches away from contact and controls overlapping mechanics', () => {
	const tile = body();
	const toggled = { listening: true };
	tile.mechanics = {
		jump: { grounded: () => false, listening: true },
		fall: { listening: true },
		coyote: { listening: true },
		orient: { listening: true },
		walk: { one: toggled },
		wall: { grab: { doing: () => true, listening: true }, slide: { listening: true }, climb: { listening: true } },
	};
	const wallJump = new WallJump( tile );
	tile.mechanics.wall.jump = wallJump;
	tile.physics.contact.left = true;
	input( {}, { jump: true } );
	assert.equal( wallJump.doing(), true );
	wallJump.do();
	assert.equal( tile.physics.velocity.x, wallJump.settings.lateral );
	assert.equal( tile.physics.velocity.y, -wallJump.settings.power );
	assert.equal( tile.mechanics.jump.listening, false );
	wallJump.ignore( true );
	assert.equal( toggled.listening, true );
} );

/** Contract: Dash maps combos to impulses, limits uses, and locks competing mechanics. */
test( 'Dash maps directional combos to bounded impulses', () => {
	const tile = body();
	const competing = { listening: true };
	tile.mechanics = {
		jump: { grounded: () => false, listening: true },
		fall: competing,
		coyote: { listening: true },
		orient: { listening: true },
		walk: { walk: { listening: true } },
		wall: { grab: { doing: () => false, listening: true } },
	};
	const dash = new Dash( tile );
	tile.mechanics.dash = dash;
	dash.combo( 'dashRight' );
	assert.equal( tile.physics.velocity.x, dash.settings.power.x );
	assert.equal( dash.uses, 1 );
	assert.equal( competing.listening, false );
	assert.equal( dash.active(), true );
	assert.equal( dash.can( 'left' ), false );
	dash.ignore( true );
	assert.equal( competing.listening, true );
	dash.uses = dash.settings.limit;
	dash.impulse.clear();
	dash.cool.clear();
	assert.equal( dash.maxed(), true );
} );

/** Contract: Collide filters solids, performs broad and narrow phases, and renders debug bounds. */
test( 'Collide resolves nearby solid tiles and renders debug bounds', () => {
	const moving = body();
	let contacts = 0;
	moving.physics.contact.check = () => contacts++;
	const nearby = body();
	nearby.density = 1;
	const distant = body();
	distant.density = 1;
	distant.physics.position.x = 1000;
	const empty = body();
	empty.density = 0;
	const originalTiles = Game.Room.tiles;
	const originalRect = Game.View.buffer.rect;
	const originalCameraPosition = Game.Camera.position;
	let drawings = 0;
	Game.Room.tiles = { platforms: [ nearby, empty ], walls: [ distant ] };
	Game.Camera.position = { x: 0, y: 0, z: 0 };
	Game.View.buffer.rect = () => drawings++;
	const collide = new Collide( moving );
	assert.deepEqual( collide.solids(), [ nearby, distant ] );
	collide.listen( { x: 1 } );
	assert.equal( contacts, 1 );
	collide.debug = true;
	collide.render( moving );
	assert.equal( drawings, 1 );
	collide.unhooks();
	Game.Room.tiles = originalTiles;
	Game.View.buffer.rect = originalRect;
	Game.Camera.position = originalCameraPosition;
} );
