import Vector from './vector.js';

/**
 * The Orientation object.
 *
 * This object is responsible for storing & manipulating the direction
 * that a Tile is facing as Euler angles in degrees.
 */
export default class Orientation extends Vector {

	/**
	 * Construct the object.
	 *
	 * @param {Number} x
	 * @param {Number} y
	 * @param {Number} z
	 * @returns {Orientation} this
	 */
	constructor(
		x = Vector.defaults.x,
		y = Vector.defaults.y,
		z = Vector.defaults.z,
	) {
		super( x, y, z );

		// Return.
		return this;
	}
}
