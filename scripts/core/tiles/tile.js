import Game from '../game.js';

import { Collision, Mass, Orientation, Position, Size } from '../physics/exports.js';

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
	 * @param {Int}      mass
	 */
	constructor( group = [], position = { x: 0, y: 0, scale: 'up' }, size = { w: 1, h: 1, scale: 'up' }, color = 'Green', type = 'default', solid = true, mass = 1 ) {
		this.set( group, position, size, color, type, solid );
	}

	/**
	 * Set the object.
	 *
	 * @param {Array}    group
	 * @param {Position} position
	 * @param {Size}     size
	 * @param {String}   color
	 * @param {String}   type
	 * @param {Int}      mass
	 */
	set = ( group = [], position = { x: 0, y: 0, scale: 'up' }, size = { w: 1, h: 1, scale: 'up' }, color = 'Green', type = 'default', solid = true, mass = 1 ) => {
		this.reset( group, position, size, color, type, solid );
	}

	/**
	 * Reset the Tile.
	 *
	 * @param {Array}    group
	 * @param {Position} position
	 * @param {Size}     size
	 * @param {String}   color
	 * @param {String}   type
	 * @param {Boolean}  solid
	 * @param {Int}      mass
	 */
	reset = ( group = [], position = { x: 0, y: 0, scale: 'up' }, size = { w: 1, h: 1, scale: 'up' }, color = 'Green', type = 'default', solid = true, mass = 1 ) => {

		// Physics.
		this.position    = new Position( position.x, position.y, position.scale );
		this.orientation = new Orientation();
		this.size        = new Size( size.w, size.h, size.scale );
		this.mass        = new Mass( mass );

		// Attributes.
		this.group   = group;
		this.color   = color;
		this.type    = type;
		this.solid   = solid;
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
		if ( ! this.visible || ! Math.round( this.size.w + this.size.h ) ) {
			return;
		}

		// Get vars.
		let camera = Game.Camera.position,
			view   = Game.View.buffer,
			offset = new Position(
				( this.position.x - camera.x ),
				( this.position.y - camera.y ),
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
		view.rect( this.color, offset, this.size );

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
		let index = this.group.indexOf( this );

		// Remove item and return true.
		if ( index > -1 ) {
			this.group.splice( index, 1 );

			Game.Hooks.do( 'Tile.destroy', this );

			delete this;
			return true;
		}

		// Assume false.
		return false;
	}
}
