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
	 */
	constructor(
		x = 0,
		y = 0
	) {
		super( x, y );
	}
}
