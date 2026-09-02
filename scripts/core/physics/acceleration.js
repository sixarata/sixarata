import Vector from './vector.js';

/**
 * The Acceleration object.
 *
 * This object is responsible for holding, calculating, and adjusting the change
 * in velocity over time.
 */
export default class Acceleration extends Vector {

	/**
	 * Construct the Acceleration.
	 *
	 * @param {Number} x
	 * @param {Number} y
	 * @param {Number} z
	 */
	constructor(
		x = Vector.defaults.x,
		y = Vector.defaults.y,
		z = Vector.defaults.z
	) {
		super( x, y, z );

		// Return.
		return this;
	}
}
