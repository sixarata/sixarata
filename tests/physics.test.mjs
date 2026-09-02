import assert from 'node:assert/strict';
import test from 'node:test';

import Acceleration from '../scripts/core/physics/acceleration.js';
import Collision from '../scripts/core/physics/collision.js';
import Contact from '../scripts/core/physics/contact.js';
import Coordinate from '../scripts/core/physics/coordinate.js';
import Damping from '../scripts/core/physics/damping.js';
import Gravity from '../scripts/core/physics/gravity.js';
import Kinematics from '../scripts/core/physics/kinematics.js';
import Mass from '../scripts/core/physics/mass.js';
import Orientation from '../scripts/core/physics/orientation.js';
import Point from '../scripts/core/physics/point.js';
import Position from '../scripts/core/physics/position.js';
import Scale from '../scripts/core/physics/scale.js';
import Size from '../scripts/core/physics/size.js';
import Vector from '../scripts/core/physics/vector.js';
import Velocity from '../scripts/core/physics/velocity.js';
import Volume from '../scripts/core/physics/volume.js';
import Time from '../scripts/core/utilities/time.js';

/**
 * Assert two floating-point values are within an explicit tolerance.
 *
 * @param {Number} actual Observed value.
 * @param {Number} expected Required value.
 * @param {Number} tolerance Maximum absolute difference.
 * @returns {void}
 */
const closeTo = (
	actual,
	expected,
	tolerance = 0.000001
) => assert.ok( Math.abs( actual - expected ) <= tolerance );

/** Contract: Coordinate remains numerically consistent after mutation. */
test( 'Coordinate remains numerically consistent after mutation', () => {
	const coordinate = new Coordinate( 3 );

	coordinate.addLinear( 2 ).multiplyLinear( 3 ).divideLinear( 5 );

	assert.equal( coordinate.value, 3 );
	assert.equal( Number( coordinate ), 3 );
	assert.equal( JSON.stringify( coordinate ), '3' );
} );

/** Contract: Coordinate distance and interpolation are correct. */
test( 'Coordinate distance and interpolation are correct', () => {
	const coordinate = new Coordinate( 3 );

	assert.equal( coordinate.distance( 8 ), 5 );
	coordinate.lerp( 7, 0.5 );
	assert.equal( Number( coordinate ), 5 );
} );

/** Contract: Coordinate exposes subtraction, squaring, length, and tolerance comparisons. */
test( 'Coordinate complete arithmetic and comparison surface remains numeric', () => {
	const coordinate = new Coordinate( 5 );
	coordinate.sub( 2 ).subLinear( 1 );
	assert.equal( Number( coordinate ), 2 );
	assert.equal( coordinate.square( 3 ), 13 );
	assert.equal( coordinate.length( 3 ), Math.sqrt( 13 ) );
	assert.equal( coordinate.squareDistance( 5 ), 9 );
	assert.equal( coordinate.equals( 2 ), true );
} );

/** Contract: Coordinate imports, exports, resets, and handles zero division. */
test( 'Coordinate imports, exports, resets, and handles zero division', () => {
	const coordinate = new Coordinate( 12 );
	const exported = coordinate.export();

	assert.notEqual( exported, coordinate );
	assert.equal( exported.equals( coordinate ), true );
	assert.equal( coordinate.divide( 0 ).empty(), true );
	assert.equal( Number( coordinate.import( exported ) ), 12 );
	assert.equal( Number( coordinate.reset() ), 0 );
} );

/** Contract: Vector arithmetic uses vector semantics. */
test( 'Vector arithmetic uses vector semantics', () => {
	const vector = new Vector( 3, 4, 2 );

	assert.equal( vector.length(), Math.sqrt( 29 ) );
	assert.equal( vector.dot( new Vector( 2, 3, 4 ) ), 26 );
	vector.add( { x: 1, y: -1, z: 2 } ).multiplyLinear( 2 );
	assert.deepEqual( [ vector.x, vector.y, vector.z ], [ 8, 6, 8 ] );
} );

/** Contract: Vector exposes every component-wise, scalar, copy, and interpolation operation. */
test( 'Vector complete arithmetic surface remains mutable and chainable', () => {
	const vector = new Vector( 2, 4, 6 );

	vector.sub( { x: 1, y: 2, z: 3 } );
	assert.deepEqual( [ vector.x, vector.y, vector.z ], [ 1, 2, 3 ] );
	vector.subLinear( 1 ).multiply( { x: 2, y: 3, z: 4 } );
	assert.deepEqual( [ vector.x, vector.y, vector.z ], [ 0, 3, 8 ] );
	vector.divideLinear( 2 );
	assert.deepEqual( [ vector.x, vector.y, vector.z ], [ 0, 1.5, 4 ] );
	vector.import( { x: 3, y: 4, z: 0 } );
	assert.equal( vector.square(), 25 );
	assert.equal( vector.empty(), false );
	assert.equal( vector.lerp( { x: 5, y: 6, z: 2 }, 0.5 ), vector );
	assert.deepEqual( [ vector.x, vector.y, vector.z ], [ 4, 5, 1 ] );
	assert.deepEqual( [ vector.export().x, vector.export().y, vector.export().z ], [ 4, 5, 1 ] );
	assert.deepEqual( [ vector.divideLinear( 0 ).x, vector.y, vector.z ], [ 0, 0, 0 ] );
} );

/** Contract: Vector distance is pure and three-dimensional. */
test( 'Vector distance is pure and three-dimensional', () => {
	const point = new Point( 3, 4, 12 );

	assert.equal( point.distance( new Point() ), 13 );
	assert.deepEqual( [ point.x, point.y, point.z ], [ 3, 4, 12 ] );
} );

/** Contract: Vector exports preserve concrete types and zero division is finite. */
test( 'Vector exports preserve concrete types and zero division is finite', () => {
	const point = new Point( 6, 8, 10 );
	const exported = point.export();

	assert.ok( exported instanceof Point );
	assert.notEqual( exported, point );
	assert.deepEqual( [ exported.x, exported.y, exported.z ], [ 6, 8, 10 ] );
	point.divide( { x: 2, y: 0 } );
	assert.deepEqual( [ point.x, point.y, point.z ], [ 3, 0, 0 ] );
} );

/** Contract: Physical vector types inherit from Vector, not Point. */
test( 'Physical vector types inherit from Vector, not Point', () => {
	for ( const value of [
		new Velocity(),
		new Acceleration(),
		new Orientation(),
	] ) {
		assert.ok( value instanceof Vector );
		assert.equal( value instanceof Point, false );
	}
} );

/** Contract: Position and Size scale world units into logical pixels. */
test( 'Position and Size scale world units into logical pixels', () => {
	const position = new Position( 2, 3, 1 );
	const size = new Size( 2, 3, 1 );

	assert.deepEqual( [ position.x, position.y, position.z ], [ 64, 96, 32 ] );
	assert.deepEqual( [ size.w, size.h, size.d ], [ 64, 96, 32 ] );
	assert.deepEqual(
		[ new Position( 2, 3, 1, false ).x, new Size( 2, 3, 1, false ).w ],
		[ 2, 2 ]
	);
} );

/** Contract: Position and Size support up, down, raw reset, and visibility branches. */
test( 'Position and Size complete their scaling lifecycles', () => {
	const position = new Position( 2, 3, 4, false );
	assert.deepEqual( [ position.rescale( 'down' ).x, position.y, position.z ], [ 0, 0, 0 ] );
	assert.deepEqual( [ position.reset().x, position.y, position.z ], [ 2, 3, 4 ] );

	const size = new Size( 2, 3, 4, false );
	assert.equal( size.viewable(), true );
	assert.deepEqual( [ size.rescale( 'down' ).w, size.h, size.d ], [ 0, 0, 0 ] );
	assert.deepEqual( [ size.reset().w, size.h, size.d ], [ 2, 3, 4 ] );
	assert.equal( new Size( 1, 0, 1, false ).viewable(), false );
} );

/** Contract: Scale follows the configured logical tile size. */
test( 'Scale follows the configured logical tile size', () => {
	const scale = new Scale();

	assert.equal( scale.up( 2 ), 64 );
	assert.equal( scale.down( 64 ), 2 );
} );

/** Contract: Gravity and damping expose conventional, readable settings. */
test( 'Gravity and damping expose conventional, readable settings', () => {
	assert.equal( new Gravity().acceleration, 1440 );
	assert.equal( new Damping().retention, 0.65 );
	assert.equal( new Damping().stepsPerSecond, 60 );
} );

/** Contract: Time converts milliseconds and its current step to seconds. */
test( 'Time converts milliseconds and its current step to seconds', () => {
	const originalStep = Time.step;

	Time.step = 8;

	assert.equal( Time.seconds(), 0.008 );
	assert.equal( Time.seconds( 250 ), 0.25 );
	assert.equal( Time.seconds( -1 ), 0 );
	assert.ok( Number.isFinite( Time.epoch() ) );

	Time.step = originalStep;
} );

/** Contract: Kinematics integration is refresh-rate independent. */
test( 'Kinematics integration is refresh-rate independent', () => {
	const kinematics = new Kinematics();
	const at30Hz = new Point();
	const at60Hz = new Point();
	const at120Hz = new Point();
	const velocity = new Velocity( 300, -480, 0 );

	for ( let frame = 0; frame < 30; frame++ ) {
		kinematics.integrate( at30Hz, velocity, 1 / 30 );
	}

	for ( let frame = 0; frame < 60; frame++ ) {
		kinematics.integrate( at60Hz, velocity, 1 / 60 );
	}

	for ( let frame = 0; frame < 120; frame++ ) {
		kinematics.integrate( at120Hz, velocity, 1 / 120 );
	}

	assert.ok( at30Hz.equals( at60Hz, 0.000001 ) );
	assert.ok( at60Hz.equals( at120Hz, 0.000001 ) );
	closeTo( at60Hz.x, 300 );
	closeTo( at60Hz.y, -480 );
} );

/** Contract: Kinematics displacement and integration preserve signed motion. */
test( 'Kinematics displacement and integration preserve signed motion', () => {
	const kinematics = new Kinematics();
	const position = new Point( 10, 20, 30 );
	const velocity = new Velocity( -4, 6, 2 );

	assert.equal( kinematics.displacement( -4, 0.5 ), -2 );
	assert.equal( kinematics.displacement( 4, -1 ), 0 );
	assert.equal( kinematics.integrate( position, velocity, 0.5 ), position );
	assert.deepEqual( [ position.x, position.y, position.z ], [ 8, 23, 31 ] );
} );

/** Contract: Damping is refresh-rate independent. */
test( 'Damping is refresh-rate independent', () => {
	const damping = new Damping();
	let at30Hz = 300;
	let at60Hz = 300;
	let at120Hz = 300;

	for ( let frame = 0; frame < 30; frame++ ) {
		at30Hz = damping.apply( at30Hz, 1 / 30 );
	}

	for ( let frame = 0; frame < 60; frame++ ) {
		at60Hz = damping.apply( at60Hz, 1 / 60 );
	}

	for ( let frame = 0; frame < 120; frame++ ) {
		at120Hz = damping.apply( at120Hz, 1 / 120 );
	}

	closeTo( at30Hz, at60Hz );
	closeTo( at60Hz, at120Hz );
} );

/** Contract: Damping approaches a target without overshooting it. */
test( 'Damping approaches a target without overshooting it', () => {
	const damping = new Damping();

	assert.equal( damping.approach( 0, 10, 1 / 60, 0.25 ), 2.5 );
	assert.equal( damping.approach( 20, 10, 1 / 60, 1 ), 10 );
	assert.equal( damping.apply( 100, 0 ), 100 );
} );

/** Contract: Kinematics applies acceleration in units per second squared. */
test( 'Kinematics applies acceleration in units per second squared', () => {
	const kinematics = new Kinematics();
	const at30Hz = new Velocity();
	const at60Hz = new Velocity();
	const at120Hz = new Velocity();
	const gravity = new Acceleration( 0, 1440, 0 );

	for ( let frame = 0; frame < 30; frame++ ) {
		kinematics.accelerate( at30Hz, gravity, 1 / 30 );
	}

	for ( let frame = 0; frame < 60; frame++ ) {
		kinematics.accelerate( at60Hz, gravity, 1 / 60 );
	}

	for ( let frame = 0; frame < 120; frame++ ) {
		kinematics.accelerate( at120Hz, gravity, 1 / 120 );
	}

	closeTo( at30Hz.y, 1440 );
	closeTo( at30Hz.y, at60Hz.y );
	closeTo( at60Hz.y, at120Hz.y );
} );

/** Contract: Mass and Volume are meaningful scalar quantities. */
test( 'Mass and Volume are meaningful scalar quantities', () => {
	assert.equal( Number( new Mass( 4 ) ), 4 );
	assert.equal( Number( new Mass( -1 ) ), 0 );
	assert.equal( Number( new Volume( 2, 3, 4 ) ), 24 );
} );

/** Contract: Mass and Volume reset, serialize, and clamp invalid dimensions. */
test( 'Mass and Volume reset, serialize, and clamp invalid dimensions', () => {
	const mass = new Mass( 4 );
	const volume = new Volume( 2, -3, 4 );

	assert.equal( JSON.stringify( mass ), '4' );
	assert.equal( Number( mass.reset() ), 0 );
	assert.equal( Number( volume ), 0 );
	assert.equal( JSON.stringify( volume.set( 2, 3, 4 ) ), '24' );
	assert.equal( Number( volume.reset() ), 0 );
} );

/** Contract: Mass and Volume implement explicit primitive coercion. */
test( 'Mass and Volume implement explicit primitive coercion', () => {
	const mass = new Mass( 7 );
	const volume = new Volume( 2, 3, 4 );

	assert.equal( mass[ Symbol.toPrimitive ](), 7 );
	assert.equal( volume[ Symbol.toPrimitive ](), 24 );
} );

/** Contract: Collision detects overlapping two-dimensional bounds. */
test( 'Collision detects overlapping two-dimensional bounds', () => {
	const tile = ( x, y, w = 10, h = 10 ) => ( {
		physics: {
			position: { x, y },
			size: { w, h },
		},
	} );

	assert.equal( new Collision( tile( 0, 0 ), tile( 9, 9 ) ).detect(), true );
	assert.equal( new Collision( tile( 0, 0 ), tile( 10, 10 ) ).detect(), false );
} );

/** Contract: Collision can be rebound and reset through its full lifecycle. */
test( 'Collision supports set and reset lifecycle operations', () => {
	const collision = new Collision( { one: true }, { two: true } );
	assert.deepEqual( collision.reset(), collision );
	assert.deepEqual( collision.tile1, {} );
	assert.deepEqual( collision.tile2, {} );
} );

/** Contract: Contact resolves against the stationary tile dimensions. */
test( 'Contact resolves against the stationary tile dimensions', () => {
	const moving = {
		physics: {
			position: { x: 5, y: 5 },
			size: { w: 2, h: 3 },
			velocity: { x: -2, y: -3 },
			contact: new Contact(),
		},
	};
	const stationary = {
		physics: {
			position: { x: 10, y: 20 },
			size: { w: 8, h: 9 },
		},
	};

	moving.physics.contact.check( { x: -2 }, moving, stationary );
	assert.equal( moving.physics.position.x, 18 );
	assert.equal( moving.physics.velocity.x, 0 );

	moving.physics.contact.reset().check( { y: -3 }, moving, stationary );
	assert.equal( moving.physics.position.y, 29 );
	assert.equal( moving.physics.velocity.y, 0 );
} );

/** Contract: Contact resolves all four collision directions. */
test( 'Contact resolves all four collision directions', () => {
	const moving = {
		physics: {
			position: { x: 0, y: 0 },
			size: { w: 2, h: 3 },
			velocity: { x: 1, y: 1 },
			contact: new Contact(),
		},
	};
	const stationary = {
		physics: {
			position: { x: 10, y: 20 },
			size: { w: 8, h: 9 },
		},
	};

	moving.physics.contact.check( { x: 1 }, moving, stationary );
	assert.equal( moving.physics.position.x, 8 );
	assert.equal( moving.physics.contact.right, true );

	moving.physics.velocity.x = -1;
	moving.physics.contact.reset().check( { x: -1 }, moving, stationary );
	assert.equal( moving.physics.position.x, 18 );
	assert.equal( moving.physics.contact.left, true );

	moving.physics.contact.reset().check( { y: 1 }, moving, stationary );
	assert.equal( moving.physics.position.y, 17 );
	assert.equal( moving.physics.contact.bottom, true );

	moving.physics.velocity.y = -1;
	moving.physics.contact.reset().check( { y: -1 }, moving, stationary );
	assert.equal( moving.physics.position.y, 29 );
	assert.equal( moving.physics.contact.top, true );
} );
