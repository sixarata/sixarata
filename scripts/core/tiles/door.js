import { Trigger } from './exports.js';

/**
 * The Door object.
 *
 * This object is responsible for progressing through the game.
 *
 * By default, colliding with a door will increase the Room by one.
 */
 export default class Door extends Trigger {

	/**
	 * Construct the Door.
	 *
	 * @param {Array}    group
	 * @param {Position} position
	 * @param {Size}     size
	 * @param {Number}   room
	 */
	constructor(
		group    = [],
		position = { x: 0, y: 0, z: 0 },
		size     = { w: 1, h: 1, d: 1 },
		room     = 1
	) {
		super( group, position, size, 'Black', 'default', 0, 0, 1 );

		return this.set( room );
	}

	/**
	 * Set the Door.
	 *
	 * @param {Number} room
	 */
	set = (
		room = 1
	) => {
		this.room = room;

		return this;
	}
}
