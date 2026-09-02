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

	/**
	 * Construct a vector from its axis components.
	 *
	 * @param {Number} x Horizontal component.
	 * @param {Number} y Vertical component.
	 * @param {Number} z Depth component.
	 * @returns {Vector} this
	 */
	constructor(
		x = Vector.defaults.x,
		y = Vector.defaults.y,
		z = Vector.defaults.z
	) {
		return this.set( x, y, z );
	}

	/**
	 * Replace all three components.
	 *
	 * @param {Number} x Horizontal component.
	 * @param {Number} y Vertical component.
	 * @param {Number} z Depth component.
	 * @returns {Vector} this
	 */
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

	/** @returns {Vector} this, reset to the default components. */
	reset = () => {
		this.x = Vector.defaults.x;
		this.y = Vector.defaults.y;
		this.z = Vector.defaults.z;

		return this;
	}

	/**
	 * Add another vector component by component.
	 *
	 * @param {Object} vector Vector-like addend.
	 * @returns {Vector} this
	 */
	add = ( vector = {} ) => {
		this.x += Number( vector.x ?? 0 );
		this.y += Number( vector.y ?? 0 );
		this.z += Number( vector.z ?? 0 );

		return this;
	}

	/** @param {Number} scalar Addend for every axis. @returns {Vector} this */
	addLinear = ( scalar = 1 ) => this.add( {
		x: scalar,
		y: scalar,
		z: scalar,
	} );

	/**
	 * Subtract another vector component by component.
	 *
	 * @param {Object} vector Vector-like subtrahend.
	 * @returns {Vector} this
	 */
	sub = ( vector = {} ) => {
		this.x -= Number( vector.x ?? 0 );
		this.y -= Number( vector.y ?? 0 );
		this.z -= Number( vector.z ?? 0 );

		return this;
	}

	/** @param {Number} scalar Subtrahend for every axis. @returns {Vector} this */
	subLinear = ( scalar = 1 ) => this.addLinear( -scalar );

	/**
	 * Multiply by another vector component by component.
	 *
	 * @param {Object} vector Vector-like factors.
	 * @returns {Vector} this
	 */
	multiply = ( vector = {} ) => {
		this.x *= Number( vector.x ?? 0 );
		this.y *= Number( vector.y ?? 0 );
		this.z *= Number( vector.z ?? 0 );

		return this;
	}

	/** @param {Number} scalar Factor for every axis. @returns {Vector} this */
	multiplyLinear = ( scalar = 1 ) => {
		this.x *= scalar;
		this.y *= scalar;
		this.z *= scalar;

		return this;
	}

	/**
	 * Divide by another vector component by component.
	 *
	 * A missing or zero divisor resets that result component to zero instead of
	 * producing `NaN` or infinity.
	 *
	 * @param {Object} vector Vector-like divisors.
	 * @returns {Vector} this
	 */
	divide = ( vector = {} ) => {
		this.x = Number( vector.x ) ? this.x / Number( vector.x ) : 0;
		this.y = Number( vector.y ) ? this.y / Number( vector.y ) : 0;
		this.z = Number( vector.z ) ? this.z / Number( vector.z ) : 0;

		return this;
	}

	/** @param {Number} scalar Divisor for every axis. @returns {Vector} this */
	divideLinear = ( scalar = 1 ) => scalar
		? this.multiplyLinear( 1 / scalar )
		: this.reset();

	/** @param {Object} vector Vector-like value. @returns {Vector} this */
	import = ( vector = {} ) => {
		this.x = Number( vector.x ?? 0 );
		this.y = Number( vector.y ?? 0 );
		this.z = Number( vector.z ?? 0 );

		return this;
	}

	/** @returns {Vector} An independent instance of the same concrete type. */
	export = () => new this.constructor( this.x, this.y, this.z );

	/**
	 * Calculate the sum of squares along the selected axes.
	 *
	 * @returns {Number} Squared magnitude.
	 */
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

	/** @returns {Number} Magnitude along the selected axes. */
	length = (
		axis1 = 'x',
		axis2 = 'y',
		axis3 = 'z'
	) => Math.sqrt( this.square( axis1, axis2, axis3 ) );

	/** @param {Object} vector Vector-like endpoint. @returns {Number} Squared distance. */
	squareDistance = ( vector = {} ) => {
		const dx = this.x - Number( vector.x ?? 0 );
		const dy = this.y - Number( vector.y ?? 0 );
		const dz = this.z - Number( vector.z ?? 0 );

		return ( dx * dx ) + ( dy * dy ) + ( dz * dz );
	}

	/** @param {Object} vector Vector-like endpoint. @returns {Number} Distance. */
	distance = ( vector = {} ) => Math.sqrt( this.squareDistance( vector ) );

	/** @returns {Boolean} Whether another vector is within the tolerance. */
	equals = (
		vector    = {},
		tolerance = 0.0001
	) => this.distance( vector ) < tolerance;

	/** @returns {Boolean} Whether the magnitude is within the zero tolerance. */
	empty = ( tolerance = 0.0001 ) => this.length() < tolerance;

	/** @param {Object} vector Vector-like operand. @returns {Number} Dot product. */
	dot = ( vector = {} ) => (
		( this.x * Number( vector.x ?? 0 ) )
		+
		( this.y * Number( vector.y ?? 0 ) )
		+
		( this.z * Number( vector.z ?? 0 ) )
	);

	/**
	 * Interpolate every component toward another vector in place.
	 *
	 * @param {Object} vector Vector-like target.
	 * @param {Number} amount Interpolation fraction.
	 * @returns {Vector} this
	 */
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
