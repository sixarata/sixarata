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

	constructor( value = Coordinate.defaults.value ) {
		return this.set( value );
	}

	static number = ( value = 0 ) => Number( value?.value ?? value );

	set = ( value = Coordinate.defaults.value ) => {
		this.value = Coordinate.number( value );

		return this;
	}

	reset = () => this.set();

	valueOf = () => this.value;

	toJSON = () => this.value;

	[ Symbol.toPrimitive ] = () => this.value;

	add = ( coordinate = 0 ) => this.set(
		this.value + Coordinate.number( coordinate )
	);

	addLinear = ( scalar = 1 ) => this.add( scalar );

	sub = ( coordinate = 0 ) => this.set(
		this.value - Coordinate.number( coordinate )
	);

	subLinear = ( scalar = 1 ) => this.sub( scalar );

	multiply = ( coordinate = 0 ) => this.set(
		this.value * Coordinate.number( coordinate )
	);

	multiplyLinear = ( scalar = 1 ) => this.multiply( scalar );

	divide = ( coordinate = 0 ) => {
		const divisor = Coordinate.number( coordinate );

		return divisor ? this.set( this.value / divisor ) : this.reset();
	}

	divideLinear = ( scalar = 1 ) => this.divide( scalar );

	import = ( coordinate = 0 ) => this.set( coordinate );

	export = () => new Coordinate( this.value );

	square = ( coordinate = 0 ) => {
		const other = Coordinate.number( coordinate );

		return ( this.value * this.value ) + ( other * other );
	}

	length = ( coordinate = 0 ) => Math.sqrt( this.square( coordinate ) );

	squareDistance = ( coordinate = 0 ) => {
		const difference = this.value - Coordinate.number( coordinate );

		return difference * difference;
	}

	distance = ( coordinate = 0 ) => Math.sqrt( this.squareDistance( coordinate ) );

	equals = (
		coordinate = 0,
		tolerance  = 0.0001
	) => this.distance( coordinate ) < tolerance;

	empty = ( tolerance = 0.0001 ) => Math.abs( this.value ) < tolerance;

	dot = ( coordinate = 0 ) => this.value * Coordinate.number( coordinate );

	lerp = (
		coordinate = 0,
		amount     = 1
	) => this.set(
		this.value + ( Coordinate.number( coordinate ) - this.value ) * amount
	);
}
