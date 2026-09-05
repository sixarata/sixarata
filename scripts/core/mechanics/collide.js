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
		distance: 1,
	}

	/**
	 * Moving Tile whose contacts are resolved, or null when unbound.
	 * @type {Tile|null}
	 */
	tile;

	/**
	 * Whether listen() performs collision checks.
	 * @type {Boolean}
	 */
	listening;

	/**
	 * Dimensionless broad-phase distance multiplier, defaulting to one.
	 * @type {Number}
	 */
	distance;

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
		this.distance  = Collide.defaults.distance;
		this.collision.reset();

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

		// Check nonzero-density tiles for collisions.
		this.check( velocity );
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
	 * Describe a padded world-space envelope around the moving Tile.
	 *
	 * Each edge extends by this Tile's corresponding dimension times distance.
	 * This diagnostic envelope is not the exact candidate rejection region:
	 * scan() also accounts for each candidate's dimensions. No state is mutated.
	 *
	 * @returns {Object|null} Logical-pixel position and size, or null when unbound.
	 */
	bounds = () => {
		if ( ! this.tile?.physics ) {
			return null;
		}
		const { position, size } = this.tile.physics;
		const x = size.w * this.distance;
		const y = size.h * this.distance;

		return {
			position: {
				x: position.x - x,
				y: position.y - y,
				z: position.z,
			},
			size: {
				w: size.w + ( x * 2 ),
				h: size.h + ( y * 2 ),
				d: size.d,
			},
		};
	}
}
