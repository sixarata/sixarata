/**
 * The Point object.
 *
 * This object represents a single set of X and Y coordinates, and
 * provides methods to help with calculating against them.
 */
export default class Point {

	/**
	 * Construct the Point.
	 *
	 * @param {Int} x
	 * @param {Int} y
	 */
	constructor( x = 0, y = 0 ) {
		this.set( x, y );
	}

	/**
	 * Set the coordinates of the Point.
	 *
	 * @param {Int} x
	 * @param {Int} y
	 * @returns {Point}
	 */
	set = ( x = 0, y = 0 ) => {
		this.x = x;
		this.y = y;

		return this;
	}

	/**
	 * Reset the coordinates of the Point to 0.
	 *
	 * @returns {Point}
	 */
	reset = () => {
		return this.set( 0, 0 );
	}

	/**
	 * Add a Point to this Point.
	 *
	 * @param {Point} p
	 * @returns {Point}
	 */
	add = ( p = { x: 0, y: 0 } ) => {
		return this.set(
			( this.x + p.x ),
			( this.y + p.y ),
		);
	}

	/**
	 * Add to this Point linearly.
	 *
	 * @param {Int} scale
	 * @returns {Point}
	 */
	addLinear = ( scale = 1 ) => {
		return this.add( {
			x: scale,
			y: scale,
		} );
	}

	/**
	 * Subtract a Point from this Point.
	 *
	 * @param {Point} p
	 * @returns {Point}
	 */
	sub = ( p = { x: 0, y: 0 } ) => {
		return this.set(
			( this.x - p.x ),
			( this.y - p.y ),
		);
	}

	/**
	 * Subtract from this Point linearly.
	 *
	 * @param {Int} scale
	 * @returns {Point}
	 */
	subLinear = ( scale = 1 ) => {
		return this.sub( {
			x: scale,
			y: scale,
		} );
	}

	/**
	 * Multiply this Point by a Point.
	 *
	 * @param {Point} p
	 * @returns {Point}
	 */
	multiply = ( p = { x: 0, y: 0 } ) => {
		return this.set(
			( this.x * p.x ),
			( this.y * p.y ),
		);
	}

	/**
	 * Multiply this Point linearly.
	 *
	 * @param {Int} scale
	 * @returns {Point}
	 */
	multiplyLinear = ( scale = 1 ) => {
		return this.multiply( {
			x: scale,
			y: scale,
		} );
	}

	/**
	 * Divide this Point by a Point.
	 *
	 * @param {Point} p
	 * @returns {Point}
	 */
	divide = ( p = { x: 0, y: 0 } ) => {
		return this.set(
			( this.x / p.x ),
			( this.y / p.y ),
		);
	}

	/**
	 * Divide this Point linearly.
	 *
	 * @param {Int} scale
	 * @returns {Point}
	 */
	divideLinear = ( scale = 1 ) => {
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
	 * @param {Point} p
	 * @returns {Point}
	 */
	import = ( p = { x: 0, y: 0 } ) => {
		return this.set(
			p.x,
			p.y,
		);
	}

	/**
	 * Export this Point into a new Point.
	 *
	 * @returns {Point}
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
	 * @returns {Point}
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
	 * @returns {Int}
	 */
	length = () => {
		return Math.sqrt( this.square() );
	}

	/**
	 * Get the square distance between Points.
	 *
	 * @param {Point} p
	 * @returns {Int}
	 */
	squareDistance = ( p = { x: 0, y: 0 } ) => {
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
	 * @param {Point} p
	 * @returns {Int}
	 */
	distance = ( p = { x: 0, y: 0 } ) => {
		return Math.sqrt( this.squareDistance( p ) );
	}

	/**
	 * Does a Point equal this Point?
	 *
	 * @param {Point} p
	 * @returns {Boolean}
	 */
	equals = ( p = { x: 0, y: 0 } ) => {
		return ( this.distance( p ) < 0.0001 );
	}

	/**
	 * Is this Point empty?
	 *
	 * @returns {Boolean}
	 */
	empty = () => {
		return ( this.length() < 0.0001 );
	}

	/**
	 * Get the dot product of two Points.
	 *
	 * @param {Point} p
	 * @returns {Int}
	 */
	dot = ( p = { x: 0, y: 0 } ) => {
		return (
			( this.x * p.x )
			+
			( this.y * p.y )
		);
	}

	/**
	 * Linearly progress this Point to a Point.
	 *
	 * @param {Point} p
	 * @param {Int}   i
	 * @returns {Point}
	 */
	lerp = ( p = { x: 0, y: 0 }, i = 1 ) => {
		let x = ( ( p.x - this.x ) * i ) + this.x,
			y = ( ( p.y - this.y ) * i ) + this.y;

		return this.set( x, y );
	}
}
