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
		this.tile = null;
	}

	/**
	 * Apply gravity & clamp downward velocity.
	 */
	listen = () => {

        // Bail if no tile.
		if ( ! this.tile ) {
			return;
		}

        // Compensation function.
		const comp = Game.Frames.compensate;

		// On ground:
		const contact  = this.tile.physics?.contact;
		const velocity = this.tile.physics?.velocity;

		if ( contact.bottom ) {

            // Apply base gravity.
			velocity.y = comp( Game.Gravity.force );

		// Airborne:
		} else {

            // Terminal velocity.
			const term = Settings.physics.terminal ?? this.tile.jumps.power;

			// Accumulate gravity until terminal velocity is reached.
			if ( velocity.y <= term ) {
				velocity.y = velocity.y + comp( Game.Gravity.force );
			}

			// Cap velocity at terminal velocity.
			if ( velocity.y > term ) {
				velocity.y = term;
			}
		}
	}
}
