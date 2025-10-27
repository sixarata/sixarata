import Game from '../game.js';
import { Smoke } from '../utilities/exports.js';

/**
 * The Fog class.
 *
 * Weather effect using fluid simulation for realistic fog behavior.
 * Fog slowly drifts and can be affected by player movement.
 */
export default class Fog {

	/**
	 * Fluid simulation for fog.
	 *
	 * @var {Smoke}
	 */
	simulation = null;

	/**
	 * Fog parameters.
	 *
	 * @var {Object}
	 */
	enabled = false;
	density = 0.5;
	color = { r: 0.9, g: 0.9, b: 0.95 };
	driftSpeed = { x: 0.02, y: -0.01 };
	spawnRate = 0.1;  // Probability per frame to spawn new fog.

	/**
	 * Construct the Fog weather effect.
	 *
	 * @param {Object} options Configuration options.
	 */
	constructor(
        options = {}
    ) {
		Object.assign( this, options );
		this.set();
	}

	/**
	 * Set / initialize.
	 */
	set = () => {
		this.reset();
		return this;
	}

	/**
	 * Reset internal state.
	 */
	reset = () => {

		// Create fluid simulation for fog.
		// Use lower resolution for performance.
		this.simulation = new Smoke( 32, 32, 1, {
			viscosity: 0.000001,
			diffusion: 0.0005,
			buoyancy: 0.0,  // Fog doesn't rise.
			cooling: 1.0,   // No temperature decay.
			iterations: 2,
		} );

		// Set cell size based on screen dimensions.
		if ( Game.Screen?.width ) {
			this.simulation.cellSize = Game.Screen.width / 32;
		}

		return this;
	}

	/**
	 * Register hooks with global Hooks system.
	 */
	hooks = () => {
		Game.Hooks.add( 'Frame.tick', this.tick, 9 );
		Game.Hooks.add( 'Frame.render', this.render, 5 );
	}

	/**
	 * Enable fog.
	 */
	enable = () => {
		this.enabled = true;
		return this;
	}

	/**
	 * Disable fog.
	 */
	disable = () => {
		this.enabled = false;
		return this;
	}

	/**
	 * Tick event handler.
	 */
	tick = () => {

        // Skip update if fog is disabled.
		if ( ! this.enabled ) {
            return;
        }

		// Add ambient fog drift.
		if ( Math.random() < this.spawnRate ) {
			const x = Math.random() * Game.Screen.width;
			const y = Math.random() * Game.Screen.height;

			this.simulation.addSmoke(
				x,
				y,
				this.density * 0.1,
				0.0,
				this.color,
				this.driftSpeed,
				3
			);
		}

		// Add continuous drift velocity.
		for ( let y = 0; y < this.simulation.height; y++ ) {
			for ( let x = 0; x < this.simulation.width; x++ ) {
				const idx = this.simulation.index( x, y );
				this.simulation.velocityX[ idx ] += this.driftSpeed.x * 0.1;
				this.simulation.velocityY[ idx ] += this.driftSpeed.y * 0.1;
			}
		}

		// Step simulation.
		this.simulation.step( 0.016 );
	}

	/**
	 * Render event handler.
	 */
	render = () => {

        // Skip render if fog is disabled.
		if ( ! this.enabled ) {
            return;
        }

        // Skip if no context.
		const ctx = Game.View.buffer.context;
		if ( ! ctx ) {
            return;
        }

		// Render fog with additive blending for ethereal effect.
		this.simulation.renderBlended( ctx, 1, 'source-over' );
	}

	/**
	 * Get the fluid simulation (so player/objects can interact).
	 *
	 * @returns {Smoke}
	 */
	getSimulation = () => {
		return this.simulation;
	}

	/**
	 * Add disturbance to fog (e.g., from player movement).
	 *
	 * @param {Number} x        World X position.
	 * @param {Number} y        World Y position.
	 * @param {Object} velocity Velocity to add.
	 * @param {Number} radius   Radius of influence.
	 */
	disturb = (
        x,
        y,
        velocity,
        radius = 3
    ) => {

        // Skip if fog is disabled.
		if ( ! this.enabled ) {
            return;
        }

        // Add velocity disturbance.
		this.simulation.addVelocity(
			x,
			y,
			velocity.x,
			velocity.y,
			radius
		);
	}
}
