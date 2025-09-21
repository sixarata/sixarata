import Scale from './scale.js';

/**
 * The Volume object.
 *
 * This object is responsible for storing & manipulating the height, width, and depth
 * coordinates of an object. See also: Position.
 */
export default class Volume {

	/**
	 * Construct the object.
	 *
	 * @param {Number} w
	 * @param {Number} h
	 * @param {Number} d
	 * @returns {Volume}
	 */
	constructor(
		w = 0,
		h = 0,
		d = 0
	) {
		return this.set( w, h, d );
	}

	/**
	 * Set the object.
	 *
	 * @param {Number} w
	 * @param {Number} h
	 * @param {Number} d
	 * @returns {Volume}
	 */
	set = (
		w = 0,
		h = 0,
		d = 0
	) => {

		// Attributes.
		this.w = w;
		this.h = h;
		this.d = d;

		// Return.
		return this;
	}

	/**
	 * Reset all dimensions.
	 *
	 * @returns {Volume}
	 */
	reset = () => {
		return this.set( 0, 0, 0 );
	}
}
