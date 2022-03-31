import { Tile } from './exports.js';

/**
 * The Trigger object.
 *
 * This object is responsible for progressing through the game. By default,
 * colliding with a door will increase the Room by one.
 */
 export default class Trigger extends Tile {

	/**
	 * Construct the Trigger.
	 *
	 * @param {Array}    group
	 * @param {Position} position
	 * @param {Size}     size
	 * @param {String}   color
	 * @param {String}   type
	 * @param {Int}      mass
	 * @param {Int}      opacity
	 */
	constructor( group = [], position = { x: 0, y: 0 }, size = { w: 1, h: 1 }, color = '', type = 'default', solid = false, mass = 1, opacity = 0 ) {
		super( group, position, size, color, type, solid, mass, opacity );
	}
}
