import Point from './point.js';

/**
 * The Acceleration object.
 *
 * This object is responsible for holding, calculating, and adjusting the change
 * in Velocity of a thing. It may be influenced by other physical forces,
 * such as Gravity, Friction, etc...
 */
 export default class Acceleration extends Point {

	/**
	 * Construct the Acceleration.
	 *
	 * @param {Number} x
	 * @param {Number} y
	 * @param {Number} z
	 */
	constructor(
		x = Point.defaults.x,
		y = Point.defaults.y,
		z = Point.defaults.z
	) {
		super( x, y, z );

		// Return.
		return this;
	}
}
