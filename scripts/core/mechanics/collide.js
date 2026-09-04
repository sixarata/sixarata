import Settings from '../../content/settings.js';
import Game from '../game.js';
import { Collision } from '../physics/exports.js';

/**
 * The Collide mechanic.
 *
 * Detects overlap with nonzero-density Tiles, then asks Contact to identify and
 * resolve the side that was touched.
 */
export default class Collide {

	/**
	 * Default collide settings.
	 *
	 * @type {Object}
	 */
	static defaults = {
		debug: false,
		distance: 1,
	}

	/**
	 * Reusable narrow-phase overlap detector.
	 *
	 * @type {Collision}
	 */
	collision = new Collision();

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
		this.debug     = Settings?.debug ?? Collide.defaults.debug;
		this.distance  = Collide.defaults.distance;
		this.collision.reset();

		// Hook into tile render for debug visualization.
		Game.Hooks.add( 'Tile.render', this.render );

		// Return.
		return this;
	}

	/**
	 * Remove global hooks owned by this mechanic.
	 */
	unhooks = () => Game.Hooks.remove( 'Tile.render', this.render );

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

		// Check nonzero-density tiles for collisions.
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
	 * Get all collidable Tiles with nonzero density.
	 *
	 * Density is currently used as the collision threshold. Its numeric value is
	 * retained for future material and force mechanics.
	 *
	 * @returns {Array} Array of nonzero-density Tiles.
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
	 * @returns {void}
	 */
	check = (
		velocity = { x: 0, y: 0, z: 0 }
	) => {
		const contact = this.tile.physics?.contact;

		this.scan( Game.Room.tiles.platforms, velocity, contact );
		this.scan( Game.Room.tiles.walls, velocity, contact );
	}

	/**
	 * Resolve collisions against one existing Tile collection.
	 *
	 * Empty Tiles are skipped before the distance and overlap checks. The
	 * reusable Collision instance avoids allocating a detector per candidate.
	 *
	 * @protected
	 * @param {Array}  solids Existing Tile collection to inspect.
	 * @param {Object} velocity Partial velocity {x?, y?, z?} for axis resolution context.
	 * @param {Contact} contact Moving Tile's contact resolver.
	 * @returns {void}
	 */
	scan = (
		solids   = [],
		velocity = { x: 0, y: 0, z: 0 },
		contact  = null
	) => {
		const len = solids.length;

		for ( let i = 0; i < len; i++ ) {

			// Get the collidable tile.
			const s = solids[ i ];

			// Skip Tiles that do not currently participate in collision.
			if ( ! s.density ) {
				continue;
			}

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
			this.collision.set( this.tile, s );

			// Skip if not collided.
			if ( ! this.collision.detect() ) {
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
		Game.Room.buffer.rect(
			'#ff00ff',
			offsetPos,
			detectionSize,
			0.2
		);
	}
}
