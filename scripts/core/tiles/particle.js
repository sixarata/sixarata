import Game from '../game.js';

import { Tile } from './exports.js';
import { Size, Velocity } from '../physics/exports.js';

/**
 * The Particle object.
 *
 * This object is responsible for drawing a single particle of many in a series.
 */
export default class Particle extends Tile {

	/**
	 * Life of the Particle.
	 *
	 * @var {Number} Default 1000.
	 */
	life = 1000;

	/**
	 * Fade of the Particle.
	 *
	 * @var {Number} Default 1000.
	 */
	fade = 1000;

	/**
	 * Construct the Particle.
	 *
	 * @param {array}  group
	 * @param {Tile}   tile
	 * @param {Tile}   target
	 * @param {Size}   size
	 * @param {String} type
	 */
	constructor(
		group    = [],
		tile     = {},
		color    = 'White',
		size     = { w: 0.1, h: 0.1 },
		velocity = { x: 0, y: 0 },
		life     = 1000,
		fade     = 1000
	) {

		// Reposition & rescale so super() works correctly.
		let source = Game.View.center(
				tile.position,
				tile.size,
				new Size( size.w, size.h, 'up' ),
				false,
			);

		// Parent.
		super( group, source, size, color, 'default', false );

		// Initialize.
		this.set( velocity, life, fade );
	}

	/**
	 * Set the Particle.
	 *
	 * @param {Velocity} velocity
	 * @param {Number}      life
	 * @param {Number}      fade
	 */
	set = (
		velocity = { x: 0, y: 0 },
		life     = 1000,
		fade     = 1000
	) => {

		// Velocity.
		this.velocity = new Velocity(
			velocity.x,
			velocity.y
		);

		// Attributes.
		this.born = new Date();
		this.life = life;
	}

	/**
	 * Tick through time.
	 */
	tick = () => {

		// Die if life is over anyways.
		if ( ( new Date() - this.born ) >= this.life ) {
			return this.destroy();
		}

		// Die if too small to be visible.
		if ( ( this.size.w < 0.01 ) && ( this.size.h < 0.01 ) ) {
			return this.destroy();
		}

		const comp = Game.Frames.compensate;

		// Update position.
		this.position.x = ( this.position.x + comp( this.velocity.x ) );
		this.position.y = ( this.position.y + comp( this.velocity.y ) );
	}
}
