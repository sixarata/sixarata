import Point from './point.js';

/**
 * The Orientation object.
 *
 * This object is responsible for storing & manipulating the direction
 * that a Tile is facing.
 */
export default class Orientation extends Point {

	/**
	 * The X direction.
	 *
	 * @var {Number} Default 0.
	 */
	x = 0;

	/**
	 * The Y direction.
	 *
	 * @var {Number} Default 0.
	 */
	y = 0;

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
