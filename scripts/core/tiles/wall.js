import { Tile } from './exports.js';

/**
 * The Wall object.
 *
 * This object represents a basic wall for the player to be obstructed by.
 */
export default class Wall extends Tile {

	/**
	 * Construct the object.
	 *
	 * @param {Array}    group
	 * @param {Position} position
	 * @param {Size}     size
	 * @param {String}   type
	 * @param {Boolean}  solid
	 */
	constructor( group = [], position = { x: 0, y: 0 }, size = { w: 1, h: 1 }, type = 'default', solid = true ) {
		super( group, position, size, '#555555', type, solid );
	}
}
