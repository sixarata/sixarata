import Game from '../game.js';
import Time from '../utilities/time.js';

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
		size     = { w: 0.1, h: 0.1, d: 0.1 },
		velocity = { x: 0, y: 0, z: 0 },
		life     = 1000,
		fade     = 1000
	) {

		// Reposition & rescale so super() works correctly.
		let source = Game.View.center(
				tile.physics.position,
				tile.physics.size,
				new Size( size.w, size.h, size.d, 'up' ),
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
	 * @param {Number}   life
	 * @param {Number}   fade
	 */
	set = (
		velocity = { x: 0, y: 0, z: 0 },
		life     = 1000,
		fade     = 1000
	) => {

		// Velocity.
		this.physics.velocity = new Velocity(
			velocity.x,
			velocity.y,
			velocity.z
		);

		// Attributes.
		this.born = Time.now;
		this.life = life;
	}

	/**
	 * Tick through time.
	 */
	tick = () => {

		// Current monotonic timestamp.
		const now  = Time.now;
		const smol = 0.01;

		// Die if life is over.
		if ( ( now - this.born ) >= this.life ) {
			return this.destroy();
		}

		// Die if too small to be visible.
		if (
			( this.physics.size.w < smol )
			&&
			( this.physics.size.h < smol )
			&&
			( this.physics.size.d < smol )
		) {
			return this.destroy();
		}

		const scale = Time.scale;

		// Update position.
		this.physics.position.x += ( this.physics.velocity.x * scale );
		this.physics.position.y += ( this.physics.velocity.y * scale );
		this.physics.position.z += ( this.physics.velocity.z * scale );
	}
}
