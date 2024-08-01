/**
 * The Coordinate object.
 *
 * This object represents a single Coordinate, reprented as a Number,
 * and provides methods to help with interacting with other Coordinates.
 */
export default class Coordinate extends Number {

	/**
	 * The tolerance for calculations.
	 */
	#tolerance = 0.0001;

	/**
	 * Construct the Coordinate.
	 *
	 * @param {Number} value Default 0.
	 */
	constructor(
		value = 0
	) {
		super( value );
		this.set( value );
	}

	/**
	 * Set the value of this Coordinate.
	 *
	 * @param   {Number}     value Default 0.
	 * @returns {Coordinate} This Coordinate, with a new value.
	 */
	set = (
		value = 0
	) => {
		this.value = value;

		return this;
	}

	/**
	 * Reset the value of this Coordinate to 0.
	 *
	 * @returns {Coordinate} The new Coordinate.
	 */
	reset = () => {
		return this.set( 0 );
	}

	/**
	 * Add a Coordinate to this one.
	 *
	 * @param   {Coordinate} c Coordinate. Default: { value: 0 }.
	 * @returns {Coordinate} This Coordinate, with a new value.
	 */
	add = (
		c = {
			value: 0
		}
	) => {
		return this.set(
			( this.value + c.value )
		);
	}

	/**
	 * Add to this Coordinate linearly.
	 *
	 * @param   {Number}     l Lineal. Default 1.
	 * @returns {Coordinate} This Coordinate, with a new value.
	 */
	addLinear = (
		l = 1
	) => {
		return this.add( {
			value: l
		} );
	}

	/**
	 * Subtract a Coordinate from this one.
	 *
	 * @param   {Coordinate} c Coordinate. Default: { value: 0 }.
	 * @returns {Coordinate} This Coordinate, with a new value.
	 */
	sub = (
		c = {
			value: 0
		}
	) => {
		return this.set(
			( this.value - c.value )
		);
	}

	/**
	 * Subtract from this Coordinate linearly.
	 *
	 * @param   {Number}     l Lineal. Default 1.
	 * @returns {Coordinate} This Coordinate, with a new value.
	 */
	subLinear = (
		l = 1
	) => {
		return this.sub( {
			value: l
		} );
	}

	/**
	 * Multiply this Coordinate by another one.
	 *
	 * @param   {Coordinate} c Coordinate. Default: { value: 0 }.
	 * @returns {Coordinate} This Coordinate, with a new value.
	 */
	multiply = (
		c = {
			value: 0
		}
	) => {
		return this.set(
			( this.value * c.value )
		);
	}

	/**
	 * Multiply this Coordinate linearly.
	 *
	 * @param   {Number}     l Lineal. Default 1.
	 * @returns {Coordinate} This Coordinate, with a new value.
	 */
	multiplyLinear = (
		l = 1
	) => {
		return this.multiply( {
			value: l
		} );
	}

	/**
	 * Divide this Coordinate by another one.
	 *
	 * @param   {Coordinate} c Coordinate. Default: { value: 0 }.
	 * @returns {Coordinate} This Coordinate, with a new value.
	 */
	divide = (
		c = {
			value: 0
		}
	) => {
		return this.set(
			( this.value / c.value )
		);
	}

	/**
	 * Divide this Coordinate linearly.
	 *
	 * @param   {Number}     l Lineal. Default 1.
	 * @returns {Coordinate} This Coordinate, with a new value.
	 */
	divideLinear = (
		l = 1
	) => {
		if ( l ) {
			return this.divide( {
				value: l
			} );
		} else {
			return this.reset();
		}
	}

	/**
	 * Import a Coordinate into this one.
	 *
	 * @param   {Coordinate} c Coordinate. Default: { value: 0 }.
	 * @returns {Coordinate} This Coordinate, with a new value.
	 */
	import = (
		c = {
			value: 0
		}
	) => {
		return this.set( c.value );
	}

	/**
	 * Export this Coordinate into a new Coordinate.
	 *
	 * @returns {Coordinate} A new Coordinate.
	 */
	export = () => {
		return new Coordinate( this.value );
	}

	/**
	 * Calculate a two-dimensional square using a Coordinate and this one.
	 *
	 * @param   {Coordinate} c Coordinate. Default: { value: 0 }.
	 * @returns {Number}     The square.
	 */
	square = (
		c = {
			value: 0
		}
	) => {
		return (
			( this.value * this.value )
			+
			( c.value * c.value )
		);
	}

	/**
	 * Get the length between a Coordinate and this one.
	 *
	 * @param   {Coordinate} c Coordinate. Default: { value: 0 }.
	 * @returns {Number}     The length.
	 */
	length = (
		c = {
			value: 0
		}
	) => {
		return Math.sqrt( this.square( c ) );
	}

	/**
	 * Get the square distance between a Coordinate and this one.
	 *
	 * @param   {Coordinate} c Coordinate. Default: { value: 0 }.
	 * @returns {Number}     The square distance.
	 */
	squareDistance = (
		c = {
			value: 0
		}
	) => {
		let d = ( this.value - c.value );

		return ( d * d );
	}

	/**
	 * Get the normal distance between a Coordinate and this one.
	 *
	 * @param   {Coordinate} c Coordinate. Default: { value: 0 }.
	 * @returns {Number}     The distance.
	 */
	distance = (
		c = {
			value: 0
		}
	) => {
		return Math.sqrt( this.squareDistance( c ) );
	}

	/**
	 * Does a Coordinate equal this Coordinate?
	 *
	 * @param   {Coordinate} c Coordinate. Default: { value: 0 }.
	 * @returns {Boolean}    True if equal.
	 */
	equals = (
		c = {
			value: 0
		}
	) => {
		return ( this.distance( c ) < this.#tolerance );
	}

	/**
	 * Is this Coordinate empty?
	 *
	 * @returns {Boolean} True if empty.
	 */
	empty = () => {
		return ( this.length() < this.#tolerance );
	}

	/**
	 * Get the dot product of a Coordinate and this one.
	 *
	 * @param   {Coordinate} c Coordinate. Default: { value: 0 }.
	 * @returns {Number}     The dot product.
	 */
	dot = (
		c = {
			value: 0
		}
	) => {
		return ( this.value * c.value );
	}

	/**
	 * Linearly progress this Coordinate to another one.
	 *
	 * @param   {Coordinate} c Coordinate. Default: { value: 0 }.
	 * @param   {Number}     l Lineal. Default 1.
	 * @returns {Coordinate} This Coordinate, with a new value.
	 */
	lerp = (
		c = {
			value: 0
		},
		l = 1
	) => {
		let x = ( ( c.value - this.value ) * l ) + this.value;

		return this.set( x );
	}
}
