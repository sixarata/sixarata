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
	 */
	constructor(
		w = 0,
		h = 0,
		d = 0
	) {
		this.set( w, h, d );
	}

	/**
	 * Set the object.
	 *
	 * @param {Number} w
	 * @param {Number} h
	 * @param {Number} d
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
