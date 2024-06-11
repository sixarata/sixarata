import Game from '../game.js';

import {
	Collision,
	Mass,
	Orientation,
	Position,
	Size
} from '../physics/exports.js';

/**
 * The Tile object.
 *
 * This object is responsible for the entire lifecycle of every tile
 * in any given Room.
 */
export default class Tile {

	/**
	 * The Tile group.
	 *
	 * @type {Array} group Default empty array.
	 */
	group = [];

	/**
	 * The Tile position.
	 *
	 * @type {Position} position Default empty Position object.
	 */
	position = new Position();

	/**
	 * The Tile size.
	 *
	 * @type {Size} size Default empty Size object.
	 */
	size = new Size();

	/**
	 * The Tile color.
	 *
	 * @type {String} color Default 'Green'.
	 */
	color = 'Green';

	/**
	 * The Tile type.
	 *
	 * @type {String} type Default 'default'.
	 */
	type = 'default';

	/**
	 * The Tile density.
	 *
	 * @type {Number} density Default 1.
	 */
	density = 1;

	/**
	 * The Tile mass.
	 *
	 * @type {Mass} mass Default new Mass().
	 */
	mass = new Mass();

	/**
	 * The Tile opacity.
	 *
	 * @type {Number} opacity Default 1.
	 */
	opacity = 1;

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
		position = { x: 0, y: 0, scale: 'up' },
		size     = { w: 1, h: 1, scale: 'up' },
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
		position = { x: 0, y: 0, scale: 'up' },
		size     = { w: 1, h: 1, scale: 'up' },
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
		size     = { w: 1, h: 1, d: 0, scale: 'up' },
		color    = null,
		type     = 'default',
		density  = 1,
		mass     = 1,
		opacity  = 1
	) => {

		// Physics.
		this.position    = new Position( position.x, position.y, position.z, position.scale );
		this.orientation = new Orientation();
		this.size        = new Size( size.w, size.h, size.scale );
		this.mass        = new Mass( mass );

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
		if ( ! Math.round( this.size.w + this.size.h ) ) {
			return;
		}

		// Get vars.
		let camera = Game.Camera.position,
			view   = Game.View.buffer,
			offset = new Position(
				( this.position.x - camera.x ),
				( this.position.y - camera.y ),
				( this.position.z - camera.z ),
				false
			),
			collide = new Collision(
				{
					position: offset,
					size:     this.size,
				},
				{
					position: new Position(),
					size:     view.size,
				}
			);

		// Skip if out of bounds.
		if ( ! collide.detect() ) {
			return;
		}

		// Draw the rectangle.
		view.rect( this.color, offset, this.size, this.opacity );

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
		const groupAdd = [ ...this.group, item ];

		this.group = groupAdd;

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
