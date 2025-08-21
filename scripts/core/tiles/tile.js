import Game from '../game.js';

import {
	Collision,
	Mass,
	Orientation,
	Position,
	Size,
	Velocity,
	Contact,
} from '../physics/exports.js';

/**
 * The Tile object.
 *
 * This object is responsible for the entire lifecycle of every tile
 * in any given Room.
 */
export default class Tile {

	/**
	 * Construct the object.
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
		position = { x: 0, y: 0, z: 0, scale: 'up' },
		size     = { w: 1, h: 1, d: 1, scale: 'up' },
		color    = 'Green',
		type     = 'default',
		density  = 1,
		mass     = 1,
		opacity  = 1
	) {
		this.set( group, position, size, color, type, density, mass, opacity );
	}

	/**
	 * Set the object.
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
	set = (
		group    = [],
		position = { x: 0, y: 0, z: 0, scale: 'up' },
		size     = { w: 1, h: 1, d: 1, scale: 'up' },
		color    = 'Green',
		type     = 'default',
		density  = true,
		mass     = 1,
		opacity  = 1
	) => {
		this.reset( group, position, size, color, type, density, mass, opacity );
	}

	/**
	 * Reset the Tile.
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
	reset = (
		group    = [],
		position = { x: 0, y: 0, z: 0, scale: 'up' },
		size     = { w: 1, h: 1, d: 1, scale: 'up' },
		color    = null,
		type     = 'default',
		density  = 1,
		mass     = 1,
		opacity  = 1
	) => {

		// Physics.
		this.physics = {
			position:    new Position( position.x, position.y, position.z, position.scale ),
			size:        new Size( size.w, size.h, size.d, size.scale ),
			mass:        new Mass( mass ),
			orientation: new Orientation(),
			velocity:    new Velocity( 0, 0, 0 ),
			contact:     new Contact(),
		};

		// Attributes.
		this.group   = group;
		this.color   = color;
		this.opacity = opacity;
		this.type    = type;
		this.density = density;
		this.visible = true;
		this.state   = 'static';

		// Add to group.
		this.add( this );
	}

	/**
	 * Resize the Tile.
	 */
	resize = () => {
		Game.Hooks.do( 'Tile.resize', this );
	}

	/**
	 * Tick through time.
	 */
	tick = () => {
		Game.Hooks.do( 'Tile.tick', this );
	}

	/**
	 * Update the Tile.
	 */
	update = () => {
		Game.Hooks.do( 'Tile.update', this );
	}

	/**
	 * Render the Tile.
	 */
	render = () => {

		// Skip if unviewable.
		if ( ! this.viewable() ) {
			return;
		}

		// Draw the rectangle.
		Game.View.buffer.rect(
			this.color,
			this.offset(),
			this.physics.size,
			this.opacity
		);

		Game.Hooks.do( 'Tile.render', this );
	}

	/**
	 * Get the offset position of the Tile.
	 *
	 * Relative to the Game Camera.
	 *
	 * @returns {Position}
	 */
	offset = () => {
		let camera = Game.Camera.position,
			pos    = this.physics.position;

		return new Position(
			( pos.x - camera.x ),
			( pos.y - camera.y ),
			( pos.z - camera.z ),
			false
		);
	}

	/**
	 * Check if the Tile is within the Game View.
	 *
	 * @returns {Boolean}
	 */
	viewable = () => {

		// Skip if invisible.
		if ( ! this.visible ) {
			return;
		}

		// Skip if size is not viewable.
		if ( ! this.physics.size.viewable() ) {
			return;
		}

		// Determine if tile is in view.
		const offset = {
				physics: {
					position: this.offset(),
					size:     this.physics.size,
				}
			},

			// Viewport.
			viewport = {
				physics: {
					position: Game.View.buffer.position,
					size:     Game.View.buffer.size,
				}
			},

			// Collision
			collide = new Collision( offset, viewport );

		// Check for collision.
		return collide.detect();
	}

	/**
	 * Add Tile to group.
	 *
	 * @param {Array} group
	 *
	 * @returns {Array}
	 */
	add = ( item = {} ) => {
		this.group.push( item );

		Game.Hooks.do( 'Tile.added', this );

		return this.group;
	}

	/**
	 * Destroy a Tile.
	 *
	 * @returns {Boolean}
	 */
	destroy = () => {

		// Get the group array.
		const arr = this.group;

		// Skip if no group or empty.
		if ( ! arr || ! arr.length ) {
			return false;
		}

		// Find the index.
		const i = arr.indexOf( this );

		// Skip if not found.
		if ( i < 0 ) {
			return false;
		}

		// Swap with last then pop to O(1) remove
		const last = arr.length - 1;

		// Swap with last if not the same
		if ( i !== last ) {
			arr[ i ] = arr[ last ];
		}

		// Remove last item.
		arr.pop();

		// Hook.
		Game.Hooks.do( 'Tile.destroy', this );

		// Delete reference to this tile.
		delete this;

		// Return.
		return true;
	}
}
