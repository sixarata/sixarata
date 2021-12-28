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
	 * Construct the Velocity.
	 *
	 * @param {Int} x
	 * @param {Int} y
	 */
	constructor( x = 0, y = 0 ) {
		super( x, y );
	}
}
