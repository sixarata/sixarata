import Point from './point.js';

/**
 * The Accelleration object.
 *
 * This object is responsible for holding, calculating, and adjusting the change
 * in Velocity of a thing. It may be influenced by other physical forces,
 * such as Gravity, Friction, etc...
 */
 export default class Accelleration extends Point {

	/**
	 * Construct the Accelleration.
	 *
	 * @param {int} x
	 * @param {int} y
	 */
	constructor( x = 0, y = 0 ) {
		super( x, y );
	}
}
