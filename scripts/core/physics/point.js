/**
 * The Point object.
 *
 * This object represents a single set of X and Y coordinates, and
 * provides methods to help with calculating against them.
 */
export default class Point {

	/**
	 * The X value.
	 *
	 * @var {number} x Default 0.
	 */
	x = 0;

	/**
	 * The Y value.
	 *
	 * @var {number} y Default 0.
	 */
	y = 0;

	/**
	 * The minimum tolerance for Point comparisons.
	 *
	 * @var {number} minTolerance Default 0.0001.
	 */
	minTolerance = 0.0001;

	/**
	 * Construct the Point.
	 *
	 * @param {Number} x
	 * @param {Number} y
	 */
	constructor(
		x = 0,
		y = 0
	) {
		this.set( x, y );
	}

	/**
	 * Set the coordinates of the Point.
	 *
	 * @param   {Number} x
	 * @param   {Number} y
	 * @returns {Point}  This Point, with new values.
	 */
	set = (
		x = 0,
		y = 0
	) => {
		this.x = x;
		this.y = y;

		return this;
	}

	/**
	 * Reset the coordinates of the Point to 0.
	 *
	 * @returns {Point} The new Point.
	 */
	reset = () => {
		return this.set( 0, 0 );
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
			y: 0
		}
	) => {
		return this.set(
			( this.x + p.x ),
			( this.y + p.y ),
		);
	}

	/**
	 * Add to this Point linearly.
	 *
	 * @param   {Number} scale
	 * @returns {Point}  This Point, with new values.
	 */
	addLinear = (
		scale = 1
	) => {
		return this.add( {
			x: scale,
			y: scale,
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
			y: 0
		}
	) => {
		return this.set(
			( this.x - p.x ),
			( this.y - p.y ),
		);
	}

	/**
	 * Subtract from this Point linearly.
	 *
	 * @param   {Number} scale
	 * @returns {Point}  This Point, with new values.
	 */
	subLinear = (
		scale = 1
	) => {
		return this.sub( {
			x: scale,
			y: scale,
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
			y: 0
		}
	) => {
		return this.set(
			( this.x * p.x ),
			( this.y * p.y ),
		);
	}

	/**
	 * Multiply this Point linearly.
	 *
	 * @param   {Number} scale
	 * @returns {Point}  This Point, with new values.
	 */
	multiplyLinear = (
		scale = 1
	) => {
		return this.multiply( {
			x: scale,
			y: scale,
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
			y: 0
		}
	) => {
		return this.set(
			( this.x / p.x ),
			( this.y / p.y ),
		);
	}

	/**
	 * Divide this Point linearly.
	 *
	 * @param   {Number} scale
	 * @returns {Point}  This Point, with new values.
	 */
	divideLinear = (
		scale = 1
	) => {
		if ( scale ) {
			return this.divide( {
				x: scale,
				y: scale,
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
			y: 0
		}
	) => {
		return this.set(
			p.x,
			p.y,
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
		);
	}

	/**
	 * Calculate the square of this Point.
	 *
	 * @returns {Point} The square.
	 */
	square = () => {
		return (
			( this.x * this.x )
			+
			( this.y * this.y )
		);
	}

	/**
	 * Get the length of this Point.
	 *
	 * @returns {Number} The length.
	 */
	length = () => {
		return Math.sqrt( this.square() );
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
			y: 0
		}
	) => {
		let dx = ( this.x - p.x ),
			dy = ( this.y - p.y );

		return (
			( dx * dx )
			+
			( dy * dy )
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
			y: 0
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
			y: 0
		}
	) => {
		return ( this.distance( p ) < this.minTolerance );
	}

	/**
	 * Is this Point empty?
	 *
	 * @returns {Boolean} True if empty.
	 */
	empty = () => {
		return ( this.length() < this.minTolerance );
	}

	/**
	 * Get the dot product of two Points.
	 *
	 * @param   {Point}  p
	 * @returns {Number} The dot product.
	 */
	dot = (
		p = {
			x: 0,
			y: 0
		}
	) => {
		return (
			( this.x * p.x )
			+
			( this.y * p.y )
		);
	}

	/**
	 * Linearly progress this Point to a Point.
	 *
	 * @param   {Point}  p
	 * @param   {Number} i
	 * @returns {Point}  This Point, with new values.
	 */
	lerp = (
		p = {
			x: 0,
			y: 0
		},
		i = 1
	) => {
		let x = ( ( p.x - this.x ) * i ) + this.x,
			y = ( ( p.y - this.y ) * i ) + this.y;

		return this.set( x, y );
	}
}
