import { Tile } from './exports.js';

/**
 * The Trigger object.
 *
 * This object is responsible for progressing through the game.
 *
 * By default, colliding with a trigger will increase the Room by one.
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
	 * @param {Number}   density
	 * @param {Number}   mass
	 * @param {Number}   opacity
	 */
	constructor(
		group    = [],
		position = { x: 0, y: 0 },
		size     = { w: 1, h: 1 },
		color    = '',
		type     = 'default',
		density  = 0,
		mass     = 1,
		opacity  = 0
	) {
		super( group, position, size, color, type, density, mass, opacity );
	}
}
