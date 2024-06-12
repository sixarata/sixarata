/**
 * The Point object.
 *
 * This object represents a single set of X, Y, and Z coordinates,
 * and provides methods to help with calculating against them.
 *
 * Note that the Z coordinate is currently unused. It exists for future
 * expansion.
 *
 * @todo Move "0.0001" to a constant.
 */
export default class Point {

	/**
	 * Construct the Point.
	 *
	 * @param {Number} x Default 0.
	 * @param {Number} y Default 0.
	 * @param {Number} z Default 0.
	 */
	constructor(
		x = 0,
		y = 0,
		z = 0
	) {
		this.set( x, y, z );
	}

	/**
	 * Set the coordinates of the Point.
	 *
	 * @param   {Number} x Default 0.
	 * @param   {Number} y Default 0.
	 * @param   {Number} z Default 0.
	 * @returns {Point}  This Point, with new values.
	 */
	set = (
		x = 0,
		y = 0,
		z = 0
	) => {
		this.x = x;
		this.y = y;
		this.z = z;

		return this;
	}

	/**
	 * Reset the coordinates of the Point to 0.
	 *
	 * @returns {Point} The new Point.
	 */
	reset = () => {
		return this.set( 0, 0, 0 );
	}

	/**
	 * Add a Point to this Point.
	 *
	 * @param   {Point} p
	 * @returns {Point} This Point, with new values.
	 */
	add = (
		p = {
			x: 0,
			y: 0,
			z: 0,
		}
	) => {
		return this.set(
			( this.x + p.x ),
			( this.y + p.y ),
			( this.z + p.z ),
		);
	}

	/**
	 * Add to this Point linearly.
	 *
	 * @param   {Number} lineal
	 * @returns {Point}  This Point, with new values.
	 */
	addLinear = (
		lineal = 1
	) => {
		return this.add( {
			x: lineal,
			y: lineal,
			z: lineal,
		} );
	}

	/**
	 * Subtract a Point from this Point.
	 *
	 * @param   {Point} p
	 * @returns {Point} This Point, with new values.
	 */
	sub = (
		p = {
			x: 0,
			y: 0,
			z: 0
		}
	) => {
		return this.set(
			( this.x - p.x ),
			( this.y - p.y ),
			( this.z - p.z ),
		);
	}

	/**
	 * Subtract from this Point linearly.
	 *
	 * @param   {Number} lineal
	 * @returns {Point}  This Point, with new values.
	 */
	subLinear = (
		lineal = 1
	) => {
		return this.sub( {
			x: lineal,
			y: lineal,
			z: lineal,
		} );
	}

	/**
	 * Multiply this Point by a Point.
	 *
	 * @param   {Point} p
	 * @returns {Point} This Point, with new values.
	 */
	multiply = (
		p = {
			x: 0,
			y: 0,
			z: 0
		}
	) => {
		return this.set(
			( this.x * p.x ),
			( this.y * p.y ),
			( this.z * p.z ),
		);
	}

	/**
	 * Multiply this Point linearly.
	 *
	 * @param   {Number} lineal
	 * @returns {Point}  This Point, with new values.
	 */
	multiplyLinear = (
		lineal = 1
	) => {
		return this.multiply( {
			x: lineal,
			y: lineal,
			z: lineal,
		} );
	}

	/**
	 * Divide this Point by a Point.
	 *
	 * @param   {Point} p
	 * @returns {Point} This Point, with new values.
	 */
	divide = (
		p = {
			x: 0,
			y: 0,
			z: 0
		}
	) => {
		return this.set(
			( this.x / p.x ),
			( this.y / p.y ),
			( this.z / p.z ),
		);
	}

	/**
	 * Divide this Point linearly.
	 *
	 * @param   {Number} lineal
	 * @returns {Point}  This Point, with new values.
	 */
	divideLinear = (
		lineal = 1
	) => {
		if ( lineal ) {
			return this.divide( {
				x: lineal,
				y: lineal,
				z: lineal,
			} );
		} else {
			return this.reset();
		}
	}

	/**
	 * Import a Point into this Point.
	 *
	 * @param   {Point} p
	 * @returns {Point} This Point, with new values.
	 */
	import = (
		p = {
			x: 0,
			y: 0,
			z: 0
		}
	) => {
		return this.set(
			p.x,
			p.y,
			p.z,
		);
	}

	/**
	 * Export this Point into a new Point.
	 *
	 * @returns {Point} A new Point.
	 */
	export = () => {
		return new Point(
			this.x,
			this.y,
			this.z,
		);
	}

	/**
	 * Calculate a two-dimensional square using 2 properties of this Point.
	 *
	 * @param   {String} plain1 Default 'x'.
	 * @param   {String} plain2 Default 'y'.
	 * @returns {Number} The square.
	 */
	square = (
		plain1 = 'x',
		plain2 = 'y'
	) => {
		return (
			( this[plain1] * this[plain1] )
			+
			( this[plain2] * this[plain2] )
		);
	}

	/**
	 * Get the length of this Point.
	 *
	 * @param   {String} plain1 Default 'x'.
	 * @param   {String} plain2 Default 'y'.
	 * @returns {Number} The length.
	 */
	length = (
		plain1 = 'x',
		plain2 = 'y'
	) => {
		return Math.sqrt( this.square( plain1, plain2 ) );
	}

	/**
	 * Get the square distance between Points.
	 *
	 * @param   {Point}  p
	 * @returns {Number} The square distance.
	 */
	squareDistance = (
		p = {
			x: 0,
			y: 0,
			z: 0
		}
	) => {
		let dx = ( this.x - p.x ),
			dy = ( this.y - p.y ),
			dz = ( this.z - p.z );

		return (
			( dx * dx )
			+
			( dy * dy )
			+
			( dz * dz )
		);
	}

	/**
	 * Get the normal distance between Points.
	 *
	 * @param   {Point}  p
	 * @returns {Number} The distance.
	 */
	distance = (
		p = {
			x: 0,
			y: 0,
			z: 0
		}
	) => {
		return Math.sqrt( this.squareDistance( p ) );
	}

	/**
	 * Does a Point equal this Point?
	 *
	 * @param   {Point}   p
	 * @returns {Boolean} True if equal.
	 */
	equals = (
		p = {
			x: 0,
			y: 0,
			z: 0
		}
	) => {
		return ( this.distance( p ) < 0.0001 );
	}

	/**
	 * Is this Point empty?
	 *
	 * @returns {Boolean} True if empty.
	 */
	empty = () => {
		return ( this.length() < 0.0001 );
	}

	/**
	 * Get the dot product of any Point and this one.
	 *
	 * @param   {Point}  p
	 * @returns {Number} The dot product.
	 */
	dot = (
		p = {
			x: 0,
			y: 0,
			z: 0
		}
	) => {
		return (
			( this.x * p.x )
			+
			( this.y * p.y )
			+
			( this.z * p.z )
		);
	}

	/**
	 * Linearly progress this Point to a Point.
	 *
	 * @param   {Point}  p
	 * @param   {Number} l
	 * @returns {Point}  This Point, with new values.
	 */
	lerp = (
		p = {
			x: 0,
			y: 0,
			z: 0
		},
		l = 1
	) => {
		let x = ( ( p.x - this.x ) * l ) + this.x,
			y = ( ( p.y - this.y ) * l ) + this.y,
			z = ( ( p.z - this.z ) * l ) + this.z;

		return this.set( x, y, z );
	}
}
