import Coordinate from './coordinate.js';
/**
 * The Point object.
 *
 * This object represents a single set of Coordinates (x, y, z) as a Point in
 * space and provides methods to help with calculating against them.
 */
export default class Point {

	/**
	 * The tolerance for calculations.
	 */
	#tolerance = 0.0001;

	/**
	 * Construct the Point.
	 *
	 * @param {Number} x Coordinate. Default 0.
	 * @param {Number} y Coordinate. Default 0.
	 * @param {Number} z Coordinate. Default 0.
	 */
	constructor(
		x = 0,
		y = 0,
		z = 0
	) {
		return this.set( x, y, z );
	}

	/**
	 * Set the coordinates of this Point.
	 *
	 * @param   {Number} x Coordinate. Default 0.
	 * @param   {Number} y Coordinate. Default 0.
	 * @param   {Number} z Coordinate. Default 0.
	 * @returns {Point}  This Point, with new values.
	 */
	set = (
		x = 0,
		y = 0,
		z = 0
	) => {
		this.x = new Coordinate( x );
		this.y = new Coordinate( y );
		this.z = new Coordinate( z );

		// Return.
		return this;
	}

	/**
	 * Reset the coordinates of this Point to 0.
	 *
	 * @returns {Point} The new Point.
	 */
	reset = () => {
		return this.set( 0, 0, 0 );
	}

	/**
	 * Add a Point to this Point.
	 *
	 * @param   {Point} p Default { x: 0, y: 0, z: 0 }.
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
			this.x.add( p.x ),
			this.y.add( p.y ),
			this.z.add( p.z ),
		);
	}

	/**
	 * Add to this Point linearly.
	 *
	 * @param   {Number} l Lineal. Default 1.
	 * @returns {Point}  This Point, with new values.
	 */
	addLinear = (
		l = 1
	) => {
		return this.add( {
			x: l,
			y: l,
			z: l,
		} );
	}

	/**
	 * Subtract a Point from this Point.
	 *
	 * @param   {Point} p Default { x: 0, y: 0, z: 0 }.
	 * @returns {Point} This Point, with new values.
	 */
	sub = (
		p = {
			x: 0,
			y: 0,
			z: 0,
		}
	) => {
		return this.set(
			this.x.sub( p.x ),
			this.y.sub( p.y ),
			this.z.sub( p.z )
		);
	}

	/**
	 * Subtract from this Point linearly.
	 *
	 * @param   {Number} l Lineal. Default 1.
	 * @returns {Point}  This Point, with new values.
	 */
	subLinear = (
		l = 1
	) => {
		return this.sub( {
			x: l,
			y: l,
			z: l,
		} );
	}

	/**
	 * Multiply this Point by a Point.
	 *
	 * @param   {Point} p Default { x: 0, y: 0, z: 0 }.
	 * @returns {Point} This Point, with new values.
	 */
	multiply = (
		p = {
			x: 0,
			y: 0,
			z: 0,
		}
	) => {
		return this.set(
			this.x.multiply( p.x ),
			this.y.multiply( p.y ),
			this.z.multiply( p.z )
		);
	}

	/**
	 * Multiply this Point linearly.
	 *
	 * @param   {Number} l Lineal. Default 1.
	 * @returns {Point}  This Point, with new values.
	 */
	multiplyLinear = (
		l = 1
	) => {
		return this.multiply( {
			x: l,
			y: l,
			z: l,
		} );
	}

	/**
	 * Divide this Point by a Point.
	 *
	 * @param   {Point} p Default { x: 0, y: 0, z: 0 }.
	 * @returns {Point} This Point, with new values.
	 */
	divide = (
		p = {
			x: 0,
			y: 0,
			z: 0,
		}
	) => {
		return this.set(
			this.x.divide( p.x ),
			this.y.divide( p.y ),
			this.z.divide( p.z )
		);
	}

	/**
	 * Divide this Point linearly.
	 *
	 * @param   {Number} l Lineal. Default 1.
	 * @returns {Point}  This Point, with new values.
	 */
	divideLinear = (
		l = 1
	) => {
		if ( l ) {
			return this.divide( {
				x: l,
				y: l,
				z: l,
			} );
		} else {
			return this.reset();
		}
	}

	/**
	 * Import a Point into this Point.
	 *
	 * @param   {Point} p Default { x: 0, y: 0, z: 0 }.
	 * @returns {Point} This Point, with new values.
	 */
	import = (
		p = {
			x: 0,
			y: 0,
			z: 0,
		}
	) => {
		return this.set(
			p.x,
			p.y,
			p.z
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
	 * @param   {Point}  p Default { x: 0, y: 0, z: 0 }.
	 * @returns {Number} The square distance.
	 */
	squareDistance = (
		p = {
			x: 0,
			y: 0,
			z: 0,
		}
	) => {
		let dx = this.x.sub( p.x ),
			dy = this.y.sub( p.y ),
			dz = this.z.sub( p.z );

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
	 * @param   {Point}  p Default { x: 0, y: 0, z: 0 }.
	 * @returns {Number} The distance.
	 */
	distance = (
		p = {
			x: 0,
			y: 0,
			z: 0,
		}
	) => {
		return Math.sqrt( this.squareDistance( p ) );
	}

	/**
	 * Does a Point equal this Point?
	 *
	 * @param   {Point} p Default { x: 0, y: 0, z: 0 }.
	 * @returns {Boolean} True if equal.
	 */
	equals = (
		p = {
			x: 0,
			y: 0,
			z: 0,
		}
	) => {
		return ( this.distance( p ) < this.#tolerance );
	}

	/**
	 * Is this Point empty?
	 *
	 * @returns {Boolean} True if empty.
	 */
	empty = () => {
		return ( this.length() < this.#tolerance );
	}

	/**
	 * Get the dot product of any Point and this one.
	 *
	 * @param   {Point}  p Default { x: 0, y: 0, z: 0 }.
	 * @returns {Number} The dot product.
	 */
	dot = (
		p = {
			x: 0,
			y: 0,
			z: 0,
		}
	) => {
		return (
			this.x.multiply( p.x )
			+
			this.y.multiply( p.y )
			+
			this.z.multiply( p.z )
		);
	}

	/**
	 * Linearly progress this Point to a Point.
	 *
	 * @param   {Point}  p Default { x: 0, y: 0, z: 0 }.
	 * @param   {Number} l Lineal. Default 1.
	 * @returns {Point}  This Point, with new values.
	 */
	lerp = (
		p = {
			x: 0,
			y: 0,
			z: 0,
		},
		l = 1
	) => {
		let n = new Point( p.x, p.y, p.z ).sub( this ),
			x = this.x.add( n.x * l ),
			y = this.y.add( n.y * l ),
			z = this.z.add( n.z * l );

		return this.set( x, y, z );
	}
}
