/**
 * A mutable three-dimensional vector.
 *
 * Vectors represent quantities with magnitude and direction, including
 * velocity and acceleration. Components are stored as ordinary numbers so
 * arithmetic and browser APIs observe the same values. The current game uses
 * two-dimensional motion, but retains the Z component for layered rooms and
 * future depth-aware mechanics.
 */
export default class Vector {

	static defaults = {
		x: 0,
		y: 0,
		z: 0,
	}

	constructor(
		x = Vector.defaults.x,
		y = Vector.defaults.y,
		z = Vector.defaults.z
	) {
		return this.set( x, y, z );
	}

	set = (
		x = Vector.defaults.x,
		y = Vector.defaults.y,
		z = Vector.defaults.z
	) => {
		this.x = Number( x );
		this.y = Number( y );
		this.z = Number( z );

		return this;
	}

	reset = () => {
		this.x = Vector.defaults.x;
		this.y = Vector.defaults.y;
		this.z = Vector.defaults.z;

		return this;
	}

	add = ( vector = {} ) => {
		this.x += Number( vector.x ?? 0 );
		this.y += Number( vector.y ?? 0 );
		this.z += Number( vector.z ?? 0 );

		return this;
	}

	addLinear = ( scalar = 1 ) => this.add( {
		x: scalar,
		y: scalar,
		z: scalar,
	} );

	sub = ( vector = {} ) => {
		this.x -= Number( vector.x ?? 0 );
		this.y -= Number( vector.y ?? 0 );
		this.z -= Number( vector.z ?? 0 );

		return this;
	}

	subLinear = ( scalar = 1 ) => this.addLinear( -scalar );

	multiply = ( vector = {} ) => {
		this.x *= Number( vector.x ?? 0 );
		this.y *= Number( vector.y ?? 0 );
		this.z *= Number( vector.z ?? 0 );

		return this;
	}

	multiplyLinear = ( scalar = 1 ) => {
		this.x *= scalar;
		this.y *= scalar;
		this.z *= scalar;

		return this;
	}

	divide = ( vector = {} ) => {
		this.x = Number( vector.x ) ? this.x / Number( vector.x ) : 0;
		this.y = Number( vector.y ) ? this.y / Number( vector.y ) : 0;
		this.z = Number( vector.z ) ? this.z / Number( vector.z ) : 0;

		return this;
	}

	divideLinear = ( scalar = 1 ) => scalar
		? this.multiplyLinear( 1 / scalar )
		: this.reset();

	import = ( vector = {} ) => {
		this.x = Number( vector.x ?? 0 );
		this.y = Number( vector.y ?? 0 );
		this.z = Number( vector.z ?? 0 );

		return this;
	}

	export = () => new this.constructor( this.x, this.y, this.z );

	square = (
		axis1 = 'x',
		axis2 = 'y',
		axis3 = 'z'
	) => (
		( this[ axis1 ] * this[ axis1 ] )
		+
		( this[ axis2 ] * this[ axis2 ] )
		+
		( this[ axis3 ] * this[ axis3 ] )
	);

	length = (
		axis1 = 'x',
		axis2 = 'y',
		axis3 = 'z'
	) => Math.sqrt( this.square( axis1, axis2, axis3 ) );

	squareDistance = ( vector = {} ) => {
		const dx = this.x - Number( vector.x ?? 0 );
		const dy = this.y - Number( vector.y ?? 0 );
		const dz = this.z - Number( vector.z ?? 0 );

		return ( dx * dx ) + ( dy * dy ) + ( dz * dz );
	}

	distance = ( vector = {} ) => Math.sqrt( this.squareDistance( vector ) );

	equals = (
		vector    = {},
		tolerance = 0.0001
	) => this.distance( vector ) < tolerance;

	empty = ( tolerance = 0.0001 ) => this.length() < tolerance;

	dot = ( vector = {} ) => (
		( this.x * Number( vector.x ?? 0 ) )
		+
		( this.y * Number( vector.y ?? 0 ) )
		+
		( this.z * Number( vector.z ?? 0 ) )
	);

	lerp = (
		vector = {},
		amount = 1
	) => {
		this.x += ( Number( vector.x ?? 0 ) - this.x ) * amount;
		this.y += ( Number( vector.y ?? 0 ) - this.y ) * amount;
		this.z += ( Number( vector.z ?? 0 ) - this.z ) * amount;

		return this;
	}
}
