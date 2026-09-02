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

const closeTo = (
	actual,
	expected,
	tolerance = 0.000001
) => assert.ok( Math.abs( actual - expected ) <= tolerance );

test( 'Coordinate remains numerically consistent after mutation', () => {
	const coordinate = new Coordinate( 3 );

	coordinate.addLinear( 2 ).multiplyLinear( 3 ).divideLinear( 5 );

	assert.equal( coordinate.value, 3 );
	assert.equal( Number( coordinate ), 3 );
	assert.equal( JSON.stringify( coordinate ), '3' );
} );

test( 'Coordinate distance and interpolation are correct', () => {
	const coordinate = new Coordinate( 3 );

	assert.equal( coordinate.distance( 8 ), 5 );
	coordinate.lerp( 7, 0.5 );
	assert.equal( Number( coordinate ), 5 );
} );

test( 'Vector arithmetic uses vector semantics', () => {
	const vector = new Vector( 3, 4, 2 );

	assert.equal( vector.length(), 5 );
	assert.equal( vector.dot( new Vector( 2, 3, 4 ) ), 26 );
	vector.add( { x: 1, y: -1, z: 2 } ).multiplyLinear( 2 );
	assert.deepEqual( [ vector.x, vector.y, vector.z ], [ 8, 6, 8 ] );
} );

test( 'Vector distance is pure and three-dimensional', () => {
	const point = new Point( 3, 4, 12 );

	assert.equal( point.distance( new Point() ), 13 );
	assert.deepEqual( [ point.x, point.y, point.z ], [ 3, 4, 12 ] );
} );

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

test( 'Scale follows the configured logical tile size', () => {
	const scale = new Scale();

	assert.equal( scale.up( 2 ), 64 );
	assert.equal( scale.down( 64 ), 2 );
} );

test( 'Gravity exposes acceleration and damping exposes a coefficient', () => {
	assert.equal( new Gravity().acceleration, 1440 );
	assert.equal( new Damping().coefficient, 0.65 );
} );

test( 'Kinematics uses elapsed seconds and is refresh-rate independent', () => {
	const kinematics = new Kinematics();
	const at30Hz = new Point();
	const at60Hz = new Point();
	const at120Hz = new Point();
	const velocity = new Velocity( 300, -480, 0 );

	assert.equal( kinematics.seconds( 8 ), 0.008 );

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

test( 'Kinematics damping is refresh-rate independent', () => {
	const kinematics = new Kinematics();
	let at30Hz = 300;
	let at60Hz = 300;
	let at120Hz = 300;

	for ( let frame = 0; frame < 30; frame++ ) {
		at30Hz = kinematics.decay( at30Hz, 0.65, 1 / 30 );
	}

	for ( let frame = 0; frame < 60; frame++ ) {
		at60Hz = kinematics.decay( at60Hz, 0.65, 1 / 60 );
	}

	for ( let frame = 0; frame < 120; frame++ ) {
		at120Hz = kinematics.decay( at120Hz, 0.65, 1 / 120 );
	}

	closeTo( at30Hz, at60Hz );
	closeTo( at60Hz, at120Hz );
} );

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

test( 'Mass and Volume are meaningful scalar quantities', () => {
	assert.equal( Number( new Mass( 4 ) ), 4 );
	assert.equal( Number( new Mass( -1 ) ), 0 );
	assert.equal( Number( new Volume( 2, 3, 4 ) ), 24 );
} );

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
