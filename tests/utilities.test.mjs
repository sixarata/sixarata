import assert from 'node:assert/strict';
import test from 'node:test';

import Attributes from '../scripts/core/abstractions/attributes.js';
import Generic from '../scripts/core/abstractions/generic.js';
import Audio from '../scripts/core/interfaces/audio.js';
import Scale from '../scripts/core/sound/scale.js';
import Sound from '../scripts/core/sound/sound.js';
import Colors from '../scripts/core/utilities/colors.js';
import Easing from '../scripts/core/utilities/easing.js';
import Hooks from '../scripts/core/utilities/hooks.js';
import Time from '../scripts/core/utilities/time.js';
import Timer from '../scripts/core/utilities/timer.js';

/** Contract: Hooks run callbacks by numeric priority and reject duplicates. */
test( 'Hooks run callbacks by numeric priority and reject duplicates', () => {
	const hooks = new Hooks();
	const order = [];
	const late = () => order.push( 'late' );
	const early = () => order.push( 'early' );

	hooks.add( 'test', late, 20 );
	hooks.add( 'test', early, 2 );
	hooks.add( 'test', early, 2 );
	hooks.do( 'test' );

	assert.deepEqual( order, [ 'early', 'late' ] );
	assert.equal( hooks.did( 'test', early, 2 ), true );
	assert.deepEqual( hooks.queued(), [ 'test' ] );
} );

/** Contract: Hooks reuse priority ordering until registration changes invalidate it. */
test( 'Hooks cache priority ordering between executions', t => {
	const hooks = new Hooks();
	const order = [];
	const originalSort = Array.prototype.sort;
	let sorts = 0;

	t.after( () => {
		Array.prototype.sort = originalSort;
	} );
	Array.prototype.sort = function( ...args ) {
		sorts++;

		return originalSort.apply( this, args );
	};
	hooks.add( 'cached', () => order.push( 20 ), 20 );
	hooks.add( 'cached', () => order.push( 10 ), 10 );
	hooks.do( 'cached' );
	hooks.do( 'cached' );

	assert.equal( sorts, 1 );
	hooks.add( 'cached', () => order.push( 5 ), 5 );
	hooks.do( 'cached' );
	assert.equal( sorts, 2 );
	assert.deepEqual( order, [ 10, 20, 10, 20, 5, 10, 20 ] );
} );

/** Contract: Hooks retain the latest 1,000 execution records in chronological order without shifting history. */
test( 'Hooks retain circular execution history', () => {
	const hooks = new Hooks();
	const callbacks = [];

	for ( let i = 0; i < Hooks.defaults.history + 5; i++ ) {
		const callback = () => i;

		callbacks.push( callback );
		hooks.add( `history${i}`, callback );
		hooks.do( `history${i}` );
	}

	const done = hooks.done();

	assert.equal( done.length, Hooks.defaults.history );
	assert.deepEqual(
		[ done[ 0 ].name, done.at( -1 ).name ],
		[ 'history5', `history${Hooks.defaults.history + 4}` ]
	);
	assert.equal( hooks.did( 'history0', callbacks[ 0 ] ), false );
	assert.equal( hooks.did( 'history5', callbacks[ 5 ] ), true );
} );

/** Contract: Hooks remove and clear exact zero-argument callbacks. */
test( 'Hooks remove and clear exact zero-argument callbacks', () => {
	const hooks = new Hooks();
	const first = () => {};
	const second = () => {};

	hooks.add( 'test', first );
	hooks.add( 'test', second );
	assert.equal( hooks.remove( 'test', first ), true );
	assert.equal( hooks.exists( 'test', first ), false );
	assert.equal( hooks.exists( 'test', second ), true );
	assert.equal( hooks.clear( 'test' ), true );
	assert.equal( hooks.exists( 'test', second ), false );
} );

/** Contract: Hooks restore frame-based and time-based suspensions. */
test( 'Hooks restore frame-based and time-based suspensions', () => {
	const hooks = new Hooks();
	const callback = value => value;

	hooks.add( 'frame', callback );
	hooks.suspend( 'frame', callback, 10, { frames: 2 } );
	hooks.process( true );
	assert.equal( hooks.exists( 'frame', callback ), false );
	hooks.process( true );
	assert.equal( hooks.exists( 'frame', callback ), true );

	hooks.add( 'time', callback );
	Time.now = 100;
	hooks.suspend( 'time', callback, 10, { ms: 20 } );
	Time.now = 119;
	hooks.process();
	assert.equal( hooks.exists( 'time', callback ), false );
	Time.now = 120;
	hooks.process();
	assert.equal( hooks.exists( 'time', callback ), true );
} );

/** Contract: Hooks clear current state even when a callback throws. */
test( 'Hooks clear current state even when a callback throws', () => {
	const hooks = new Hooks();
	hooks.add( 'boom', () => {
		throw new Error( 'boom' );
	} );

	assert.throws( () => hooks.do( 'boom' ), /boom/ );
	assert.equal( hooks.current(), '' );
} );

/** Contract: Hooks expose current, completed, queued, and suspended state safely. */
test( 'Hooks expose current, completed, queued, and suspended state safely', () => {
	const hooks = new Hooks();
	const observations = [];
	const callback = () => observations.push( hooks.doing( 'inspect' ) );

	hooks.add( 'inspect', callback );
	assert.deepEqual( hooks.queued(), [ 'inspect' ] );
	hooks.suspend( 'inspect', callback, 10, { frames: 1 } );
	assert.equal( hooks.suspended().length, 1 );
	hooks.process( true );
	hooks.do( 'inspect' );

	assert.deepEqual( observations, [ true ] );
	assert.equal( hooks.current(), '' );
	assert.equal( hooks.done().length, 1 );
} );

/** Contract: Audio resumes a suspended pipeline before playing its selected sound. */
test( 'Audio resumes a suspended pipeline before playing its selected sound', async () => {
	const calls = [];
	const pipeline = {
		state: 'suspended',
		resume: async () => {
			calls.push( 'resume' );
			pipeline.state = 'running';
		},
	};
	const audio = new Audio( pipeline );

	audio.setSound( { play: value => calls.push( value ) } );

	assert.equal( audio.canPlay(), false );
	assert.equal( await audio.play(), true );
	assert.equal( audio.canPlay(), true );
	assert.deepEqual( calls, [ 'resume', pipeline ] );
} );

/** Contract: Audio reports failed playback when no pipeline is available. */
test( 'Audio reports failed playback when no pipeline is available', async () => {
	const audio = new Audio( {} );

	audio.pipeline = null;

	assert.equal( audio.canPlay(), false );
	assert.equal( await audio.play(), false );
} );

/** Contract: Timer reports progress and preserves remaining time across pause. */
test( 'Timer reports progress and preserves remaining time across pause', () => {
	Time.now = 100;
	const timer = new Timer( 100 );
	Time.now = 140;
	assert.equal( timer.left(), 60 );
	assert.equal( timer.ratio(), 0.4 );
	timer.pause();
	Time.now = 500;
	assert.equal( timer.elapsed(), 40 );
	timer.resume();
	assert.equal( timer.expires, 560 );
} );

/** Contract: Timer can shift a timing window backward. */
test( 'Timer can shift a timing window backward', () => {
	Time.now = 100;
	const timer = new Timer( 100 );
	timer.shift( -20 );

	assert.equal( timer.starts, 80 );
	assert.equal( timer.expires, 180 );
} );

/** Contract: Attributes reset without mutating defaults. */
test( 'Attributes reset without mutating defaults', () => {
	const attributes = new Attributes( { color: 'red' } );

	attributes.set( 'color', 'blue' );
	attributes.merge( { size: 2 } );
	assert.equal( attributes.get( 'size' ), 2 );
	attributes.reset();
	assert.equal( attributes.get( 'color' ), 'red' );
	assert.equal( attributes.get( 'size' ), undefined );
} );

/** Contract: Generic forwards attribute return values. */
test( 'Generic forwards attribute return values', () => {
	const generic = new Generic( { answer: 42 } );

	assert.equal( generic.get( 'answer' ), 42 );
	generic.merge( { name: 'Sixarata' } );
	assert.equal( generic.get( 'name' ), 'Sixarata' );
} );

/** Contract: Sound scale generates reference and octave frequencies. */
test( 'Sound scale generates reference and octave frequencies', () => {
	const scale = new Scale();

	assert.equal( scale.getFrequency( 'A', 4 ), 440 );
	assert.equal( scale.getFrequency( 'A', 5 ), 880 );
	assert.throws( () => scale.getFrequency( 'H', 4 ), /not found/ );
} );

/** Contract: Sound reset restores consistent collection types. */
test( 'Sound reset restores consistent collection types', () => {
	const sound = new Sound();
	sound.reset();

	assert.deepEqual( sound.timbre, [] );
} );

/** Contract: Easing functions preserve their endpoints. */
test( 'Easing functions preserve their endpoints', () => {
	const easing = new Easing();

	for ( const name of [ 'outCubic', 'inExpo', 'inOutExpo', 'outCirc', 'outBack', 'outElastic', 'outBounce' ] ) {
		assert.ok( Math.abs( easing[ name ]( 0 ) ) < Number.EPSILON * 2, `${name} starts at zero` );
		assert.ok( Math.abs( easing[ name ]( 1 ) - 1 ) < Number.EPSILON * 2, `${name} ends at one` );
	}
} );

/** Contract: Colors produce valid CSS color strings. */
test( 'Colors produce valid CSS color strings', () => {
	const colors = new Colors();

	assert.match( colors.random(), /^rgb\(\d{1,3},\d{1,3},\d{1,3}\)$/ );
	assert.match( colors.cloud(), /^#[369]{6}$/ );
} );
