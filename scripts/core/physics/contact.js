import Velocity from './velocity.js';
import Tile from '../tiles/tile.js';

/**
 * The Contact object.
 *
 * This object is responsible for storing & manipulating whether or not
 * contact between Tiles has been made on any side of the calling Tile.
 */
export default class Contact {

	/**
	 * Construct the object.
	 *
	 * @param {Boolean} top
	 * @param {Boolean} right
	 * @param {Boolean} bottom
	 * @param {Boolean} left
	 * @returns {Contact}
	 */
	constructor(
		top    = false,
		right  = false,
		bottom = false,
		left   = false
	) {
		return this.set( top, right, bottom, left );
	}

	/**
	 * Set the object.
	 *
	 * @param {Boolean} top
	 * @param {Boolean} right
	 * @param {Boolean} bottom
	 * @param {Boolean} left
	 * @returns {Contact}
	 */
	set = (
		top    = false,
		right  = false,
		bottom = false,
		left   = false
	) => {

		// Attributes.
		this.top    = top;
		this.right  = right;
		this.bottom = bottom;
		this.left   = left;

		// Return.
		return this;
	}

	/**
	 * Reset the Position.
	 *
	 * @returns {Contact}
	 */
	reset = () => {
		return this.set( false, false, false, false );
	}

	/**
	 * Check if a Tile has made contact with another Tile.
	 *
	 * @param {Velocity} velocity
	 * @param {Tile}     tile1
	 * @param {Tile}     tile2
	 */
	check = (
		velocity = {},
		tile1    = {},
		tile2    = {}
	) => {

		// Is right touching?
		if ( velocity.x > 0 ) {
			tile1.physics.position.x     = ( tile2.physics.position.x - tile1.physics.size.w );
			tile1.physics.contact.right  = true;
			tile1.physics.velocity.x     = 0;
		}

		// Is left touching?
		if ( velocity.x < 0 ) {
			tile1.physics.position.x     = ( tile2.physics.position.x + tile1.physics.size.w );
			tile1.physics.contact.left   = true;
			tile1.physics.velocity.x     = 0;
		}

		// Is bottom touching?
		if ( velocity.y > 0 ) {
			tile1.physics.position.y     = ( tile2.physics.position.y - tile1.physics.size.h );
			tile1.physics.contact.bottom = true;
		}

		// Is top touching?
		if ( velocity.y < 0 ) {
			tile1.physics.position.y     = ( tile2.physics.position.y + tile1.physics.size.h );
			tile1.physics.contact.top    = true;
			tile1.physics.velocity.y++;
		}
	}
}
