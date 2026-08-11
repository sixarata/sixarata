import Game from '../game.js';
import Time from '../utilities/time.js';

import Tile from './tile.js';
import { Size, Velocity } from '../physics/exports.js';

/**
 * The FluidParticle class.
 *
 * A particle that can interact with fluid simulations.
 * Can be pushed by fluid velocity fields and emit density/velocity into them.
 */
export default class FluidParticle extends Tile {

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
	 * Reference to fluid grid (optional).
	 *
	 * @var {Fluid|null}
	 */
	fluidGrid = null;

	/**
	 * Fluid interaction strength.
	 *
	 * @var {Number} Default 0.5.
	 */
	fluidInfluence = 0.5;

	/**
	 * Whether this particle emits into the fluid.
	 *
	 * @var {Boolean} Default true.
	 */
	emitsFluid = true;

	/**
	 * Emission parameters.
	 *
	 * @var {Object}
	 */
	emission = {
		density: 0.1,
		temperature: 0.0,
		radius: 1.5,
	};

	/**
	 * Construct the FluidParticle.
	 *
	 * @param {array}      group
	 * @param {Tile}       tile
	 * @param {String}     color
	 * @param {Size}       size
	 * @param {Velocity}   velocity
	 * @param {Number}     life
	 * @param {Number}     fade
	 * @param {Fluid}  fluidGrid Optional fluid grid reference.
	 * @param {Object}     options   Additional options.
	 * @returns {FluidParticle}
	 */
	constructor(
		group     = [],
		tile      = {},
		color     = 'White',
		size      = { w: 0.1, h: 0.1, d: 0.1 },
		velocity  = { x: 0, y: 0, z: 0 },
		life      = 1000,
		fade      = 1000,
		fluidGrid = null,
		options   = {}
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
		return this.set( velocity, life, fade, fluidGrid, options );
	}

	/**
	 * Set the FluidParticle.
	 *
	 * @param {Velocity}  velocity
	 * @param {Number}    life
	 * @param {Number}    fade
	 * @param {Fluid} fluidGrid
	 * @param {Object}    options
	 * @returns {FluidParticle}
	 */
	set = (
		velocity  = { x: 0, y: 0, z: 0 },
		life      = 1000,
		fade      = 1000,
		fluidGrid = null,
		options   = {}
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
		this.fade = fade;
		this.fluidGrid = fluidGrid;

		// Apply options.
		Object.assign( this, options );

		// Return.
		return this;
	}

	/**
	 * Tick through time with fluid interaction.
	 */
	tick = () => {

		// Parent tick (global tile hooks).
		super.tick?.();

		Game.Kinematics.integrate(
			this.physics.position,
			this.physics.velocity,
			Game.Kinematics.seconds( Time.delta )
		);

		// Interact with fluid grid if available.
		if ( this.fluidGrid ) {
			this.interactWithFluid();
		}

		// Current timestamp.
		const now = Time.now;
		const age = now - this.born;

		// Check if particle has expired.
		if ( age >= this.life ) {
			this.destroy();
		}
	}

	/**
	 * Interact with the fluid simulation.
	 */
	interactWithFluid = () => {
		const pos = this.physics.position;

		// Get fluid velocity at particle position.
		if ( this.fluidInfluence > 0 ) {
			const fluidVel = this.fluidGrid.getVelocityAt( pos.x, pos.y );

			// Apply fluid velocity to particle.
			this.physics.velocity.x += fluidVel.x * this.fluidInfluence;
			this.physics.velocity.y += fluidVel.y * this.fluidInfluence;
		}

		// Emit into fluid if enabled.
		if ( this.emitsFluid ) {

			// Emit density based on particle velocity.
			const speed = Math.sqrt(
				this.physics.velocity.x * this.physics.velocity.x +
				this.physics.velocity.y * this.physics.velocity.y
			);

			// More density when moving faster.
			const emitDensity = this.emission.density * Math.min( 1, speed / 10 );

			// Check if fluid is Smoke (has addSmoke method).
			if ( typeof this.fluidGrid.addSmoke === 'function' ) {

				// Parse color from this.color string.
				const color = this.parseColor( this.color );

				this.fluidGrid.addSmoke(
					pos.x,
					pos.y,
					emitDensity,
					this.emission.temperature,
					color,
					{
						x: this.physics.velocity.x * 0.1,
						y: this.physics.velocity.y * 0.1
					},
					this.emission.radius
				);
			} else {

				// Basic fluid grid.
				this.fluidGrid.addDensity(
					pos.x,
					pos.y,
					emitDensity,
					this.emission.radius
				);

				this.fluidGrid.addVelocity(
					pos.x,
					pos.y,
					this.physics.velocity.x * 0.1,
					this.physics.velocity.y * 0.1,
					this.emission.radius
				);
			}
		}
	}

	/**
	 * Parse a color string to RGB values.
	 * Simple implementation for basic colors.
	 *
	 * @param   {String} colorName Color name like 'White', 'Red', etc.
	 * @returns {Object} RGB object {r, g, b} in 0-1 range.
	 */
	parseColor = ( colorName ) => {
		const colors = {
			'White': { r: 1, g: 1, b: 1 },
			'Black': { r: 0, g: 0, b: 0 },
			'Red': { r: 1, g: 0, b: 0 },
			'Green': { r: 0, g: 1, b: 0 },
			'Blue': { r: 0, g: 0, b: 1 },
			'Yellow': { r: 1, g: 1, b: 0 },
			'Orange': { r: 1, g: 0.5, b: 0 },
			'Purple': { r: 0.5, g: 0, b: 0.5 },
			'Gray': { r: 0.5, g: 0.5, b: 0.5 },
			'Brown': { r: 0.6, g: 0.4, b: 0.2 },
		};

		return colors[ colorName ] || { r: 1, g: 1, b: 1 };
	}

	/**
	 * Destroy the particle.
	 */
	destroy = () => {

		return super.destroy();
	}
}
