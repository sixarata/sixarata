import Point from './point.js';

/**
 * The Orientation object.
 *
 * This object is responsible for storing & manipulating the direction
 * that a Tile is facing.
 */
export default class Orientation extends Point {

	/**
	 * Construct the object.
	 *
	 * @param {Number} x
	 * @param {Number} y
	 * @param {Number} z
	 * @returns {Orientation} this
	 */
	constructor(
		x = Point.defaults.x,
		y = Point.defaults.y,
		z = Point.defaults.z,
	) {
		super( x, y, z );

		// Return.
		return this;
	}
}
