/**
 * Volume of a rectangular solid in cubic game-world units.
 */
export default class Volume {

	/**
	 * Construct the object.
	 *
	 * @param {Number} width
	 * @param {Number} height
	 * @param {Number} depth
	 * @returns {Volume}
	 */
	constructor(
		width  = 0,
		height = 0,
		depth  = 0
	) {
		return this.set( width, height, depth );
	}

	/**
	 * Set the dimensions and calculate the volume.
	 *
	 * @param {Number} width
	 * @param {Number} height
	 * @param {Number} depth
	 * @returns {Volume}
	 */
	set = (
		width  = 0,
		height = 0,
		depth  = 0
	) => {
		this.width  = Math.max( 0, Number( width ) || 0 );
		this.height = Math.max( 0, Number( height ) || 0 );
		this.depth  = Math.max( 0, Number( depth ) || 0 );
		this.value  = this.width * this.height * this.depth;

		return this;
	}

	/**
	 * Reset all dimensions.
	 *
	 * @returns {Volume}
	 */
	reset = () => this.set();

	valueOf = () => this.value;

	toJSON = () => this.value;

	[ Symbol.toPrimitive ] = () => this.value;
}
