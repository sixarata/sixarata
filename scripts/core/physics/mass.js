/**
 * Scalar mass in game-defined mass units.
 */
export default class Mass {

	/**
	 * Construct the object.
	 *
	 * @param {Number} value
	 * @returns {Mass}
	 */
	constructor( value = 1 ) {
		return this.set( value );
	}

	/**
	 * Set the mass.
	 *
	 * @param {Number} value
	 * @returns {Mass}
	 */
	set = ( value = 1 ) => {
		this.value = Math.max( 0, Number( value ) || 0 );

		return this;
	}

	/**
	 * Reset the mass.
	 *
	 * @returns {Mass}
	 */
	reset = () => this.set( 0 );

	/**
	 * Return the numeric mass during arithmetic coercion.
	 *
	 * @returns {Number} Mass value.
	 */
	valueOf = () => this.value;

	/**
	 * Serialize mass as its numeric value.
	 *
	 * @returns {Number} Mass value.
	 */
	toJSON = () => this.value;

	/**
	 * Convert mass to a JavaScript primitive.
	 *
	 * @returns {Number} Mass value.
	 */
	[ Symbol.toPrimitive ] = () => this.value;
}
