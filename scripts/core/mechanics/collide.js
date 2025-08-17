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
	 */
	constructor(
		tile = null
	) {
		this.set( tile );
	}

	/** Set the mechanic. */
	set = (
		tile = null
	) => {
		this.reset();
		this.tile = tile;
	}

	/** Reset the mechanic. */
	reset = () => {
		this.tile      = null;
		this.listening = true;
	}

	/**
	 * Perform collision resolution for the current frame.
	 *
	 * @param {Object} velocity Partial velocity {x?, y?, z?} for axis resolution context.
	 */
	listen = (
		velocity = { x: 0, y: 0, z: 0 }
	) => {

		// Skip if not listening.
		if ( ! this.listening ) {
			return;
		}

        // Skip if no tile.
		if ( ! this.tile ) {
			return;
		}

		// Gather solid tiles (platforms + walls).
		let solids = Game.Room.tiles.platforms.concat( Game.Room.tiles.walls );
		let len    = solids.length;

        // Skip if no solids.
		if ( ! len ) {
			return;
		}

        // Check each solid tile.
		const contact = this.tile.physics?.contact;

		for ( let i = 0; i < len; i++ ) {

            // Get the solid tile.
			let s = solids[ i ];

            // Skip if no density.
			if ( ! s.density ) {
				continue;
			}

            // Check for collision.
			let check = new Collision( this.tile, s );

            // Skip if not collided.
			if ( ! check.detect() ) {
				continue;
			}

            // Check contact.
			contact.check( velocity, this.tile, s );
		}
	}
}
