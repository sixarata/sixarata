import Game from '../game.js';
import Time from '../utilities/time.js';

import Tile from './tile.js';
import { Size, Velocity } from '../physics/exports.js';

/**
 * The Particle object.
 *
 * This object is responsible for drawing a single particle of many in a series.
 */
export default class Particle extends Tile {

	/**
	 * Shared monotonic millisecond timestamp when this Particle was created.
	 *
	 * @type {Number}
	 */
	bornAt;

	/**
	 * Maximum Particle lifetime in milliseconds.
	 *
	 * @type {Number}
	 */
	life = 1000;

	/**
	 * Particle fade duration in milliseconds.
	 *
	 * @type {Number}
	 */
	fade = 1000;

	/**
	 * Read the legacy Particle creation timestamp.
	 *
	 * @deprecated Use bornAt.
	 * @returns {Number} Shared monotonic creation time in milliseconds.
	 */
	get born() {
		return this.bornAt;
	}

	/**
	 * Update the Particle creation timestamp through its legacy property.
	 *
	 * @deprecated Use bornAt.
	 * @param {Number} timestamp Shared monotonic creation time in milliseconds.
	 */
	set born( timestamp ) {
		this.bornAt = timestamp;
	}

	/**
	 * Construct the Particle.
	 *
	 * @param {array}    group
	 * @param {Tile}     tile
	 * @param {String}   color
	 * @param {Size}     size
	 * @param {Velocity} velocity Velocity expressed in tiles per second.
	 * @param {Number}   life
	 * @param {Number}   fade
	 * @returns {Particle}
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
		return this.set( velocity, life, fade );
	}

	/**
	 * Configure Particle velocity, lifetime, fade duration, and creation time.
	 *
	 * @param {Velocity} velocity Velocity expressed in tiles per second.
	 * @param {Number} life Maximum lifetime in milliseconds. Defaults to 1000.
	 * @param {Number} fade Reserved fade duration in milliseconds. Defaults to 1000.
	 * @returns {Particle} this
	 */
	set = (
		velocity = { x: 0, y: 0, z: 0 },
		life     = 1000,
		fade     = 1000
	) => {

		// Velocity.
		this.physics.velocity = new Velocity(
			Game.Screen.unit( velocity.x ),
			Game.Screen.unit( velocity.y ),
			Game.Screen.unit( velocity.z )
		);

		// Attributes.
		this.bornAt = Time.now;
		this.life   = life;
		this.fade   = fade;

		// Return.
		return this;
	}

	/**
	 * Advance the Particle and destroy it after its lifetime or minimum size.
	 *
	 * Movement uses the shared bounded gameplay step. Destruction removes the
	 * Particle from its collection through the inherited Tile lifecycle.
	 *
	 * @returns {Boolean|void} Destruction result when removed; otherwise undefined.
	 */
	tick = () => {

		// Current monotonic timestamp.
		const now  = Time.now;
		const smol = 0.01;

		// Die if life is over.
		if ( ( now - this.bornAt ) >= this.life ) {
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

		Game.Kinematics.integrate(
			this.physics.position,
			this.physics.velocity,
			Time.seconds()
		);
	}
}
