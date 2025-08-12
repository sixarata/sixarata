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
		this.tile     = tile;
		this.velocity = this.tile?.physics.velocity;
	}

	/**
	 * Reset the mechanic.
	 */
	reset = () => {
		this.tile     = null;
		this.comp     = Game.Frame.compensate;
		this.settings = Settings.player.jumps;
		this.max      = Settings.physics.terminal ?? this.settings.power;
	}

	/**
	 * Apply gravity & clamp downward velocity.
	 */
	listen = () => {

		// Airborne:
		if ( this.doing() ) {
			this.do();

		// On the ground:
		} else {
			this.idle();
		}

		// Cap velocity at max.
		if ( this.maxed() ) {
			this.velocity.y = this.max;
		}
	}

	/**
	 * Check if the mechanic is being done.
	 *
	 * @returns {Boolean} True if the mechanic is being done, false otherwise.
	 */
	doing = () => {
		return this.can();
	}

	/**
	 * Check if the mechanic can be done.
	 *
	 * @returns {Boolean} True if the mechanic can be done, false otherwise.
	 */
	can = () => {
		return ! Boolean( this.tile?.physics?.contact?.bottom );
	}

	/**
	 * Do the fall.
	 */
	do = () => {
		if ( this.velocity.y <= this.max ) {
			this.velocity.y = this.velocity.y + this.comp( Game.Gravity.force );
		}
	}

	/**
	 * Check if tile has reached max fall speed.
	 *
	 * @returns {Boolean} True if max fall speed is reached, false otherwise.
	 */
	maxed = () => {
		return ( this.velocity.y >= this.max );
	}

	/**
	 * Tile is not falling.
	 *
	 * Apply base gravity force.
	 */
	idle = () => {
		this.velocity.y = this.comp( Game.Gravity.force );
	}

	/**
	 * Check if tile free-falling.
	 *
	 * No jumps, but also not on ground.
	 *
	 * @returns {Boolean} True if tile is free-falling, false otherwise.
	 */
	free = () => {
		return (
			! this.tile?.mechanics?.jump?.count
			&&
			! this.tile?.physics?.contact?.bottom
		);
	}
}
