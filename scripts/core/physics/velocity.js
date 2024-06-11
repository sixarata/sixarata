import Point from './point.js';

/**
 * The Velocity object.
 *
 * This object is responsible for holding, calculating, and adjusting the
 * movement of a thing. It may be influenced by other physical forces,
 * such as Gravity, Friction, etc...
 */
export default class Velocity extends Point {

	/**
	 * The X value.
	 *
	 * @var {Number} x Default 0.
	 */
	x = 0;

	/**
	 * The Y value.
	 *
	 * @var {Number} y Default 0.
	 */
	y = 0;

	/**
	 * Construct the Velocity.
	 *
	 * @param {Number} x
	 * @param {Number} y
	 */
	constructor(
		x = 0,
		y = 0
	) {
		super( x, y );
	}
}
