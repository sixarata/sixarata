import assert from 'node:assert/strict';
import test from 'node:test';

import Attributes from '../scripts/core/abstractions/attributes.js';
import Generic from '../scripts/core/abstractions/generic.js';
import Scale from '../scripts/core/sound/scale.js';
import Sound from '../scripts/core/sound/sound.js';
import Colors from '../scripts/core/utilities/colors.js';
import Easing from '../scripts/core/utilities/easing.js';
import Hooks from '../scripts/core/utilities/hooks.js';
import Time from '../scripts/core/utilities/time.js';
import Timer from '../scripts/core/utilities/timer.js';

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

test( 'Hooks clear current state even when a callback throws', () => {
	const hooks = new Hooks();
	hooks.add( 'boom', () => {
		throw new Error( 'boom' );
	} );

	assert.throws( () => hooks.do( 'boom' ), /boom/ );
	assert.equal( hooks.current(), '' );
} );

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

test( 'Timer can shift a timing window backward', () => {
	Time.now = 100;
	const timer = new Timer( 100 );
	timer.shift( -20 );

	assert.equal( timer.starts, 80 );
	assert.equal( timer.expires, 180 );
} );

test( 'Attributes reset without mutating defaults', () => {
	const attributes = new Attributes( { color: 'red' } );

	attributes.set( 'color', 'blue' );
	attributes.merge( { size: 2 } );
	assert.equal( attributes.get( 'size' ), 2 );
	attributes.reset();
	assert.equal( attributes.get( 'color' ), 'red' );
	assert.equal( attributes.get( 'size' ), undefined );
} );

test( 'Generic forwards attribute return values', () => {
	const generic = new Generic( { answer: 42 } );

	assert.equal( generic.get( 'answer' ), 42 );
	generic.merge( { name: 'Sixarata' } );
	assert.equal( generic.get( 'name' ), 'Sixarata' );
} );

test( 'Sound scale generates reference and octave frequencies', () => {
	const scale = new Scale();

	assert.equal( scale.getFrequency( 'A', 4 ), 440 );
	assert.equal( scale.getFrequency( 'A', 5 ), 880 );
	assert.throws( () => scale.getFrequency( 'H', 4 ), /not found/ );
} );

test( 'Sound reset restores consistent collection types', () => {
	const sound = new Sound();
	sound.reset();

	assert.deepEqual( sound.timbre, [] );
} );

test( 'Easing functions preserve their endpoints', () => {
	const easing = new Easing();

	for ( const name of [ 'outCubic', 'inExpo', 'inOutExpo', 'outCirc', 'outBack', 'outElastic', 'outBounce' ] ) {
		assert.ok( Math.abs( easing[ name ]( 0 ) ) < Number.EPSILON * 2, `${name} starts at zero` );
		assert.ok( Math.abs( easing[ name ]( 1 ) - 1 ) < Number.EPSILON * 2, `${name} ends at one` );
	}
} );

test( 'Colors produce valid CSS color strings', () => {
	const colors = new Colors();

	assert.match( colors.random(), /^rgb\(\d{1,3},\d{1,3},\d{1,3}\)$/ );
	assert.match( colors.cloud(), /^#[369]{6}$/ );
} );
