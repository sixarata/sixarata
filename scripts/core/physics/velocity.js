import { Point } from './exports.js';

/**
 * The Velocity object.
 *
 * This object is responsible for holding, calculating, and adjusting the
 * movement of a thing. It may be influenced by other physical forces,
 * such as Gravity, Friction, etc...
 */
export default class Velocity extends Point {

	/**
	 * Construct the Velocity.
	 *
	 * @param {Number} x
	 * @param {Number} y
	 * @param {Number} z
	 */
	constructor(
		x = 0,
		y = 0,
		z = 0
	) {
		super( x, y, z );
	}
}
