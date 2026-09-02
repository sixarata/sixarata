import Vector from './vector.js';

/**
 * The Velocity object.
 *
 * This object is responsible for holding, calculating, and adjusting the
	 * rate and direction of change in position.
 */
export default class Velocity extends Vector {

	/**
	 * Construct the Velocity.
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
