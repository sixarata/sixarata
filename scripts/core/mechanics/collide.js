import Settings from '../../custom/settings.js';
import Game from '../game.js';
import { Collision } from '../physics/exports.js';

/**
 * The Collide mechanic.
 *
 * Handles collision detection with solid tiles (platforms, walls) and updates contact.
 */
export default class Collide {

	/**
	 * Construct the Collide mechanic.
	 *
	 * @param {Tile} tile The moving tile.
	 * @returns {Collide} this
	 */
	constructor(
		tile = null
	) {
		return this.set( tile );
	}

	/**
	 * Set the mechanic.
	 *
	 * @param {Tile} tile The moving tile.
	 * @returns {Collide} this
	 */
	set = (
		tile = null
	) => {
		this.reset();
		this.tile = tile;

		// Return.
		return this;
	}

	/**
	 * Reset the mechanic.
	 *
	 * @returns {Collide} this
	 */
	reset = () => {
		this.tile      = null;
		this.listening = true;
		this.debug     = Settings.debug || false;
		this.distance  = 1;

		// Hook into tile render for debug visualization.
		Game.Hooks.add( 'Tile.render', this.render );

		// Return.
		return this;
	}

	/**
	 * Perform collision resolution for the current frame.
	 *
	 * @param {Object} velocity Partial velocity {x?, y?, z?} for axis resolution context.
	 * @returns {Void}
	 */
	listen = (
		velocity = { x: 0, y: 0, z: 0 }
	) => {

		// Skip if disabled or unbound.
		if ( ! this.listening || ! this.tile ) {
			return;
		}

		// Check solid tiles for collisions.
		this.check( velocity );
	}

	/**
	 * Render debug visualization.
	 *
	 * Should be called during the render phase, not during update.
	 *
	 * @param {Tile} tile The tile being rendered.
	 * @returns {Void}
	 */
	render = (
		tile = null
	) => {

		// Skip if not debugging.
		if ( ! this.debug ) {
			return;
		}

		// Skip if not the bound tile.
		if ( tile !== this.tile ) {
			return;
		}

		// Draw visualization.
		this.visualize();
	}

	/**
	 * Get all solid tiles that have density.
	 *
	 * @returns {Array} Array of solid tiles with density.
	 */
	solids = () => {
		return Game.Room.tiles.platforms.concat(
			Game.Room.tiles.walls
		).filter( tile => tile.density );
	}

	/**
	 * Check collisions against solid tiles with optimized distance check.
	 *
	 * @param {Object} velocity Partial velocity {x?, y?, z?} for axis resolution context.
	 */
	check = (
		velocity = { x: 0, y: 0, z: 0 }
	) => {
		const contact = this.tile.physics?.contact;
		const solids  = this.solids();
		const len     = solids.length;

		for ( let i = 0; i < len; i++ ) {

			// Get the solid tile.
			let s = solids[ i ];

			// Broad-phase: Quick distance rejection.
			// Skip tiles that are too far away to possibly collide.
			const maxDistX = ( s.physics.size.w + this.tile.physics.size.w ) * this.distance;
			const maxDistY = ( s.physics.size.h + this.tile.physics.size.h ) * this.distance;
			const dx       = Math.abs( s.physics.position.x - this.tile.physics.position.x );
			const dy       = Math.abs( s.physics.position.y - this.tile.physics.position.y );

			// Skip if too far away.
			if ( dx > maxDistX || dy > maxDistY ) {
				continue;
			}

			// Narrow-phase: Check for collision with AABB.
			let check = new Collision( this.tile, s );

			// Skip if not collided.
			if ( ! check.detect() ) {
				continue;
			}

			// Check contact.
			contact.check( velocity, this.tile, s );
		}
	}

	/**
	 * Visualize the collision detection area for debugging.
	 *
	 * Draws a rectangle showing the broad-phase detection bounds.
	 *
	 * @returns {Void}
	 */
	visualize = () => {

		// Skip if no tile.
		if ( ! this.tile ) {
			return;
		}

		const tile = this.tile.physics;

		// Calculate the detection area bounds.
		// This represents how far we extend from the player's edge in each direction.
		const maxDistX = tile.size.w * this.distance;
		const maxDistY = tile.size.h * this.distance;

		// Position and size of the detection rectangle.
		// The box extends maxDistX/Y in each direction from the player.
		const detectionPos = {
			x: tile.position.x - maxDistX,
			y: tile.position.y - maxDistY,
			z: tile.position.z,
		};

		const detectionSize = {
			w: tile.size.w + ( maxDistX * 2 ),
			h: tile.size.h + ( maxDistY * 2 ),
			d: tile.size.d,
		};

		// Get camera offset position.
		const camera = Game.Camera.position;
		const offsetPos = {
			x: detectionPos.x - camera.x,
			y: detectionPos.y - camera.y,
			z: detectionPos.z - camera.z,
		};

		// Draw the detection area as a semi-transparent rectangle.
		Game.View.buffer.rect(
			'#ff00ff',
			offsetPos,
			detectionSize,
			0.2
		);
	}
}
