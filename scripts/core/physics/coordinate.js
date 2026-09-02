/**
 * A mutable scalar coordinate value.
 *
 * This intentionally uses composition instead of extending Number. Native
 * Number objects have an immutable internal value, which caused arithmetic to
 * disagree with the public `value` property after mutation.
 */
export default class Coordinate {

	static defaults = {
		value: 0,
	}

	/**
	 * Construct a coordinate.
	 *
	 * @param {Number|Coordinate} value Initial numeric value.
	 * @returns {Coordinate} this
	 */
	constructor( value = Coordinate.defaults.value ) {
		return this.set( value );
	}

	/**
	 * Normalize a number or coordinate-like value into a primitive number.
	 *
	 * @param {Number|Coordinate} value Value to normalize.
	 * @returns {Number} Primitive numeric value.
	 */
	static number = ( value = 0 ) => Number( value?.value ?? value );

	/**
	 * Replace the stored coordinate value.
	 *
	 * @param {Number|Coordinate} value New value.
	 * @returns {Coordinate} this
	 */
	set = ( value = Coordinate.defaults.value ) => {
		this.value = Coordinate.number( value );

		return this;
	}

	/** Reset to zero. @returns {Coordinate} this */
	reset = () => this.set();

	/** Return the primitive numeric value. @returns {Number} value */
	valueOf = () => this.value;

	/** Serialize as a primitive number. @returns {Number} value */
	toJSON = () => this.value;

	/** Convert to a JavaScript primitive. @returns {Number} value */
	[ Symbol.toPrimitive ] = () => this.value;

	/** Add another coordinate. @param {Number|Coordinate} coordinate Addend. @returns {Coordinate} this */
	add = ( coordinate = 0 ) => this.set(
		this.value + Coordinate.number( coordinate )
	);

	/** Add a scalar. @param {Number} scalar Addend. @returns {Coordinate} this */
	addLinear = ( scalar = 1 ) => this.add( scalar );

	/** Subtract another coordinate. @param {Number|Coordinate} coordinate Subtrahend. @returns {Coordinate} this */
	sub = ( coordinate = 0 ) => this.set(
		this.value - Coordinate.number( coordinate )
	);

	/** Subtract a scalar. @param {Number} scalar Subtrahend. @returns {Coordinate} this */
	subLinear = ( scalar = 1 ) => this.sub( scalar );

	/** Multiply by another coordinate. @param {Number|Coordinate} coordinate Factor. @returns {Coordinate} this */
	multiply = ( coordinate = 0 ) => this.set(
		this.value * Coordinate.number( coordinate )
	);

	/** Multiply by a scalar. @param {Number} scalar Factor. @returns {Coordinate} this */
	multiplyLinear = ( scalar = 1 ) => this.multiply( scalar );

	/**
	 * Divide by another coordinate, resetting to zero for a zero divisor.
	 *
	 * @param {Number|Coordinate} coordinate Divisor.
	 * @returns {Coordinate} this
	 */
	divide = ( coordinate = 0 ) => {
		const divisor = Coordinate.number( coordinate );

		return divisor ? this.set( this.value / divisor ) : this.reset();
	}

	/** Divide by a scalar. @param {Number} scalar Divisor. @returns {Coordinate} this */
	divideLinear = ( scalar = 1 ) => this.divide( scalar );

	/** Import a coordinate-like value. @param {Number|Coordinate} coordinate Value. @returns {Coordinate} this */
	import = ( coordinate = 0 ) => this.set( coordinate );

	/** Export an independent copy. @returns {Coordinate} Cloned coordinate. */
	export = () => new Coordinate( this.value );

	/**
	 * Return the sum of this value squared and another value squared.
	 *
	 * @param {Number|Coordinate} coordinate Other value.
	 * @returns {Number} Sum of squares.
	 */
	square = ( coordinate = 0 ) => {
		const other = Coordinate.number( coordinate );

		return ( this.value * this.value ) + ( other * other );
	}

	/** Return the square-root of square(). @param {Number|Coordinate} coordinate Other value. @returns {Number} Length. */
	length = ( coordinate = 0 ) => Math.sqrt( this.square( coordinate ) );

	/** Return squared distance to another value. @param {Number|Coordinate} coordinate Other value. @returns {Number} Squared distance. */
	squareDistance = ( coordinate = 0 ) => {
		const difference = this.value - Coordinate.number( coordinate );

		return difference * difference;
	}

	/** Return absolute distance to another value. @param {Number|Coordinate} coordinate Other value. @returns {Number} Distance. */
	distance = ( coordinate = 0 ) => Math.sqrt( this.squareDistance( coordinate ) );

	/**
	 * Compare two values within a tolerance.
	 *
	 * @param {Number|Coordinate} coordinate Other value.
	 * @param {Number} tolerance Maximum exclusive distance.
	 * @returns {Boolean} Whether the values are effectively equal.
	 */
	equals = (
		coordinate = 0,
		tolerance  = 0.0001
	) => this.distance( coordinate ) < tolerance;

	/** Determine whether the value is effectively zero. @param {Number} tolerance Maximum magnitude. @returns {Boolean} Whether empty. */
	empty = ( tolerance = 0.0001 ) => Math.abs( this.value ) < tolerance;

	/** Multiply this value by another. @param {Number|Coordinate} coordinate Other value. @returns {Number} Scalar product. */
	dot = ( coordinate = 0 ) => this.value * Coordinate.number( coordinate );

	/**
	 * Interpolate toward another value in place.
	 *
	 * @param {Number|Coordinate} coordinate Target value.
	 * @param {Number} amount Interpolation fraction.
	 * @returns {Coordinate} this
	 */
	lerp = (
		coordinate = 0,
		amount     = 1
	) => this.set(
		this.value + ( Coordinate.number( coordinate ) - this.value ) * amount
	);
}
