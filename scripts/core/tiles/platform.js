import { Tile } from './exports.js';

/**
 * The Platform object.
 *
 * This object represents a basic platform for the player to stand on.
 */
export default class Platform extends Tile {

	/**
	 * Construct the object.
	 *
	 * @param {Array}    group
	 * @param {Position} position
	 * @param {Size}     size
	 * @param {String}  type
	 * @param {Boolean} solid
	 */
	constructor( group = [], position = { x: 0, y: 0 }, size = { w: 1, h: 1 }, type = 'default', solid = true ) {
		super( group, position, size, 'Green', type, solid );
	}
}
