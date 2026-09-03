import Game from '../game.js';
import Entity from '../abstractions/entity.js';

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
 * Tile specializes Entity with logical-pixel geometry, physical properties,
 * camera-relative visibility, rendering, and tile-specific lifecycle hooks.
 *
 * Density remains numeric rather than a Boolean solid flag. A zero-density Tile
 * is currently non-collidable, while any positive density participates in
 * collision. Fractional values are retained for future material mechanics such
 * as sinking, resistance, buoyancy, or surface-specific forces.
 */
export default class Tile extends Entity {

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
	 * @returns {Tile} this
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
		super();

		return this.set( group, position, size, color, type, density, mass, opacity );
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
	 * @returns {Tile}   this
	 */
	set = (
		group    = [],
		position = { x: 0, y: 0, z: 0, scale: 'up' },
		size     = { w: 1, h: 1, d: 1, scale: 'up' },
		color    = 'Green',
		type     = 'default',
		density  = 1,
		mass     = 1,
		opacity  = 1
	) => {
		return this.reset(
			group,
			position,
			size,
			color,
			type,
			density,
			mass,
			opacity
		);
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
	 * @returns {Tile}    this
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
		this.configure( group, type, 'static' );

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
		this.color   = color;
		this.opacity = opacity;
		this.density = Math.max( 0, Number( density ) || 0 );
		this.visible = true;

		// Add to group.
		this.add( this );

		// Return.
		return this;
	}

	/**
	 * Notify listeners that the Tile should respond to a viewport resize.
	 *
	 * @returns {void}
	 */
	resize = () => {
		Game.Hooks.do( 'Tile.resize', this );
	}

	/**
	 * Notify listeners of the Tile's time-advancement phase.
	 *
	 * @returns {void}
	 */
	tick = () => {
		Game.Hooks.do( 'Tile.tick', this );
	}

	/**
	 * Notify listeners of the Tile's state-update phase.
	 *
	 * @returns {void}
	 */
	update = () => {
		Game.Hooks.do( 'Tile.update', this );
	}

	/**
	 * Render the Tile.
	 *
	 * @returns {void}
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

		// Hook.
		Game.Hooks.do( 'Tile.render', this );
	}

	/**
	 * Get the offset position of the Tile.
	 *
	 * Relative to the Game Camera.
	 *
	 * @returns {Position} Camera-relative position in logical pixels.
	 */
	offset = () => {

		// Get camera and position.
		let camera = Game.Camera.position,
			pos    = this.physics.position;

		// Return offset position.
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
	 * @returns {Boolean|undefined} Whether the Tile intersects the viewport, or
	 * undefined when visibility or size makes the check inert.
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
	 * Publish the Tile.added hook after Entity registers a unique item.
	 *
	 * @protected
	 * @param {*} item Item that joined the Tile's owning group.
	 * @returns {void}
	 */
	added = ( item = this ) => {
		Game.Hooks.do( 'Tile.added', this );
	}

	/**
	 * Publish the Tile.destroy hook after Entity removes the Tile.
	 *
	 * @protected
	 * @returns {void}
	 */
	destroyed = () => {
		Game.Hooks.do( 'Tile.destroy', this );
	}
}
