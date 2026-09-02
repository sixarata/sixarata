/**
 * The Contact object.
 *
 * Stores which side of a moving Tile touched another Tile. After Collision
 * detects an overlap, Contact uses the incoming velocity to identify the side,
 * move the Tile back to that boundary, and stop velocity on the affected axis.
 *
 * Top, right, bottom, and left describe the current two-dimensional plane.
 * Depth-facing sides can be added if collision detection expands to the Z axis.
 */
export default class Contact {

	/**
	 * Default contact states
	 *
	 * @type {Object}
	 */
	static defaults = {
		top:    false,
		right:  false,
		bottom: false,
		left:   false,
	};

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
		top    = Contact.defaults.top,
		right  = Contact.defaults.right,
		bottom = Contact.defaults.bottom,
		left   = Contact.defaults.left
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
		top    = Contact.defaults.top,
		right  = Contact.defaults.right,
		bottom = Contact.defaults.bottom,
		left   = Contact.defaults.left
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
	 * Reset all contact states.
	 *
	 * @returns {Contact}
	 */
	reset = () => {
		return this.set(
			Contact.defaults.top,
			Contact.defaults.right,
			Contact.defaults.bottom,
			Contact.defaults.left
		);
	}

	/**
	 * Resolve an overlap and record the side that made contact.
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
			tile1.physics.position.x     = ( tile2.physics.position.x + tile2.physics.size.w );
			tile1.physics.contact.left   = true;
			tile1.physics.velocity.x     = 0;
		}

		// Is bottom touching?
		if ( velocity.y > 0 ) {
			tile1.physics.position.y     = ( tile2.physics.position.y - tile1.physics.size.h );
			tile1.physics.contact.bottom = true;
			tile1.physics.velocity.y     = 0;
		}

		// Is top touching?
		if ( velocity.y < 0 ) {
			tile1.physics.position.y     = ( tile2.physics.position.y + tile2.physics.size.h );
			tile1.physics.contact.top    = true;
			tile1.physics.velocity.y     = 0;
		}
	}
}
