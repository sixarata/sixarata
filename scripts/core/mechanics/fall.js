import Game from '../game.js';
import Settings from '../../custom/settings.js';

/**
 * The Fall mechanic.
 *
 * Applies gravity and clamps vertical (downward) velocity.
 */
export default class Fall {

	/**
	 * Construct the Fall mechanic.
	 *
	 * @param {Tile} tile A Tile with `velocity`, `contact`, `jumps`.
	 */
	constructor(
		tile = null
	) {
		this.set( tile );
	}

	/**
	 * Set the mechanic.
	 */
	set = (
		tile = null
	) => {
		this.reset();
		this.tile = tile;
	}

	/**
	 * Reset the mechanic.
	 */
	reset = () => {
		this.tile     = null;
		this.settings = Settings.player.jumps;
	}

	/**
	 * Apply gravity & clamp downward velocity.
	 */
	listen = () => {

        // Bail if no tile.
		if ( ! this.tile ) {
			return;
		}

		const comp     = Game.Frame.compensate;
		const velocity = this.tile.physics?.velocity;
		const max      = Settings.physics.terminal ?? this.settings.power;

		// Airborne:
		if ( this.doing() ) {

			// Apply gravity.
			if ( velocity.y <= max ) {
				velocity.y = velocity.y + comp( Game.Gravity.force );
			}

		// On the ground:
		} else {
			velocity.y = comp( Game.Gravity.force );
		}

		// Cap velocity at max.
		if ( velocity.y > max ) {
			velocity.y = max;
		}
	}

	/**
	 * Check if the mechanic is being done.
	 *
	 * @returns {Boolean} True if the mechanic is being done, false otherwise.
	 */
	doing = () => {

        // Bail if no tile.
		if ( ! this.can() ) {
			return false;
		}

		// Return whether the tile is airborne.
		return ! this.tile.physics?.contact.bottom;
	}

	/**
	 * Check if the mechanic can be done.
	 *
	 * @returns {Boolean} True if the mechanic can be done, false otherwise.
	 */
	can = () => {

        // Bail if no tile.
		if ( ! this.tile ) {
			return false;
		}

		// Return whether the tile is airborne.
		return ! this.tile.physics?.contact.bottom;
	}
}
