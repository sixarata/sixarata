import assert from 'node:assert/strict';
import test from 'node:test';

import { installBrowserEnvironment } from './helpers/browser.mjs';

const browser = installBrowserEnvironment();

const { default: Game } = await import( '../scripts/core/game.js' );
const { default: Draw } = await import( '../scripts/core/utilities/draw.js' );
const { default: Rain } = await import( '../scripts/core/weather/rain.js' );
const { default: Shape } = await import( '../scripts/core/physics/shape.js' );
const { default: Friction } = await import( '../scripts/core/physics/friction.js' );
const { default: Damping } = await import( '../scripts/core/physics/damping.js' );
const { default: Sound } = await import( '../scripts/core/sound/sound.js' );
const { default: SoundScale } = await import( '../scripts/core/sound/scale.js' );
const { default: Keyboard } = await import( '../scripts/core/inputs/keyboard.js' );
const { default: Gamepad } = await import( '../scripts/core/inputs/gamepad.js' );
const { default: Audio } = await import( '../scripts/core/interfaces/audio.js' );

/** Contract: Placeholder shape, drawing, and weather lifecycles remain chainable and hookable. */
test( 'Shape, Draw, and Rain expose consistent lifecycle contracts', () => {
	Game.Hooks.reset();
	const shape = new Shape();
	const draw = new Draw();
	const rain = new Rain();

	assert.equal( shape.set().reset(), shape );
	assert.equal( draw.set().reset(), draw );
	assert.equal( rain.set().reset(), rain );
	rain.hooks();
	assert.equal( Game.Hooks.queued().includes( 'Frame.tick' ), true );
	assert.equal( rain.tick(), undefined );
	assert.equal( rain.render(), undefined );
} );

/** Contract: Friction is the damping specialization and retains its numerical behavior. */
test( 'Friction preserves Damping behavior', () => {
	const friction = new Friction();

	assert.ok( friction instanceof Damping );
	assert.ok( friction.apply( 100, 1 / 60 ) < 100 );
} );

/** Contract: Sound scale validates notes and generates a complete octave. */
test( 'SoundScale validates notes and generates complete octaves', () => {
	const scale = new SoundScale();
	assert.equal( scale.generate( 4 ).length, 12 );
	assert.equal( scale.getSemitoneDifference( 'A' ), 0 );
	assert.throws( () => scale.getFrequency( 'H' ), /not found/ );
	scale.referenceSemitone = 'H';
	assert.throws( () => scale.getSemitoneDifference( 'A' ), /Reference note/ );
	assert.equal( scale.reset().referenceFrequency, 440 );
} );

/** Contract: Sound wires oscillator, gain, frequency, waveform, and delayed stop into a pipeline. */
test( 'Sound plays its configured oscillator through an audio pipeline', async () => {
	const calls = [];
	const oscillator = {
		frequency: {},
		connect: value => calls.push( [ 'oscillator.connect', value ] ),
		start: () => calls.push( [ 'start' ] ),
		stop: () => calls.push( [ 'stop' ] ),
	};
	const gain = {
		gain: {},
		connect: value => calls.push( [ 'gain.connect', value ] ),
	};
	const destination = {};
	const sound = new Sound( 220, 0.25, 'square', [], '', 0 );
	sound.play( {
		destination,
		createOscillator: () => oscillator,
		createGain: () => gain,
	} );
	await new Promise( resolve => setTimeout( resolve, 0 ) );

	assert.equal( oscillator.frequency.value, 220 );
	assert.equal( oscillator.type, 'square' );
	assert.equal( gain.gain.value, 0.25 );
	assert.deepEqual( calls.map( call => call[ 0 ] ), [ 'oscillator.connect', 'gain.connect', 'start', 'stop' ] );
	assert.equal( sound.reset().frequency, 440 );
} );

/** Contract: Audio exposes its selected sound, scale, pipeline, and playability. */
test( 'Audio selection and primitive accessors expose current playback state', () => {
	const audio = new Audio();
	const sound = new Sound();
	const scale = new SoundScale();
	assert.equal( audio.setSound( sound ), sound );
	assert.equal( audio.setScale( scale ), scale );
	assert.equal( audio.valueOf(), audio.pipeline );
	assert.equal( audio.canPlay(), true );
} );

/** Contract: Keyboard validates events, maps simultaneous keys, and exposes normalized axes. */
test( 'Keyboard handles key transitions and normalized axes', () => {
	const keyboard = new Keyboard();
	keyboard.keyDown( { code: 'ArrowLeft' } );
	keyboard.keyDown( { code: 'ArrowUp' } );
	assert.equal( keyboard.pressed( 'left' ), true );
	assert.deepEqual( keyboard.axes(), [ -1, -1 ] );
	keyboard.keyUp( { code: 'ArrowLeft' } );
	assert.equal( keyboard.pressed( 'left' ), false );
	assert.equal( keyboard.valid(), false );
	assert.equal( keyboard.keyDown( {} ), undefined );
	assert.equal( keyboard.keyUp( {} ), undefined );
	assert.equal( keyboard.keyPressed( {} ), undefined );
	assert.equal( keyboard.tick(), undefined );
	assert.ok( browser.listeners.get( 'keydown' ).length > 0 );
} );

/** Contract: Gamepad snapshots pads, resolves buttons and axes, and tracks connections. */
test( 'Gamepad polls, maps, connects, and disconnects controllers', () => {
	const pad = {
		index: 0,
		id: 'test',
		axes: [ -0.75, 0.8 ],
		buttons: Array.from( { length: 16 }, ( _, index ) => ( { pressed: index === 0 } ) ),
	};
	Object.defineProperty( globalThis, 'navigator', {
		configurable: true,
		value: { getGamepads: () => [ pad ] },
	} );
	const gamepad = new Gamepad();
	gamepad.connect( { gamepad: pad } );
	gamepad.tick();
	assert.equal( gamepad.pressed( 'jump' ), true );
	assert.equal( gamepad.pressed( 'left' ), true );
	assert.equal( gamepad.pressed( 'down' ), true );
	assert.equal( gamepad.pressed( 'missing' ), false );
	assert.deepEqual( gamepad.axes(), [ -0.75, 0.8 ] );
	gamepad.disconnect( { gamepad: pad } );
	assert.equal( gamepad.connected, false );
	assert.equal( gamepad.gamepads[ 0 ], undefined );
} );

/** Contract: Optional sunset content responds to jump hooks without unresolved game references. */
test( 'Sunset jump effects use the shared game object', async () => {
	Game.Hooks.reset();
	Game.Room.tiles = {
		particles: [],
		players: [ {
			physics: {
				position: { x: 0, y: 0, z: 0 },
				size: { w: 32, h: 32, d: 32 },
			},
		} ],
	};
	const originalPlay = Game.Audio.play;
	Game.Audio.play = async () => true;
	await import( '../scripts/content/sunset.js' );
	Game.Hooks.do( 'Player.jump' );
	assert.equal( Game.Room.tiles.particles.length, 50 );
	Game.Audio.play = originalPlay;
} );
