import Game from '../game.js';

import {
	Collision,
	Mass,
	Orientation,
	Position,
	Size,
	Velocity,
	Contact
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

		// Skip if invisible.
		if ( ! this.visible ) {
			return;
		}

		// Skip if no size.
		if ( ! Math.round( this.physics.size.w + this.physics.size.h + this.physics.size.d ) ) {
			return;
		}

		// Determine if tile is in view.
		let camera = Game.Camera.position,
			view   = Game.View.buffer,
			pos    = this.physics.position,
			size   = this.physics.size,
			offset = new Position(
				( pos.x - camera.x ),
				( pos.y - camera.y ),
				( pos.z - camera.z ),
				false
			),
			collide = new Collision(

				// New position.
				{
					physics: {
						position: offset,
						size:     size
					}
				},

				// Viewport.
				{
					physics: {
						position: new Position(),
						size:     view.size
					}
				}
			);

		// Skip if out of bounds.
		if ( ! collide.detect() ) {
			return;
		}

		// Draw the rectangle.
		view.rect( this.color, offset, size, this.opacity );

		Game.Hooks.do( 'Tile.render', this );
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
		const index = this.group.indexOf( this );

		// Remove item and return true.
		if ( index > -1 ) {
			this.group.splice( index, 1 );

			Game.Hooks.do( 'Tile.destroy', this );

			//delete this;
			return true;
		}

		// Assume false.
		return false;
	}
}
