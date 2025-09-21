import Game from '../game.js';
import Settings from '../../custom/settings.js';
import Time from '../utilities/time.js';

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
	 * @return {Fall} this
	 */
	constructor(
		tile = null
	) {
		return this.set( tile );
	}

	/**
	 * Set the mechanic.
	 *
	 * @param {Tile} tile A Tile with `velocity`, `contact`, `jumps`.
	 * @return {Fall} this
	 */
	set = (
		tile = null
	) => {
		this.reset();

		// Set properties.
		this.tile     = tile;
		this.velocity = this.tile?.physics.velocity;

		// Return.
		return this;
	}

	/**
	 * Reset the mechanic.
	 *
	 * @returns {Fall} this
	 */
	reset = () => {
		this.tile      = null;
		this.settings  = Settings.player.jumps.fall;
		this.max       = Settings.physics.terminal ?? this.settings.speed;
		this.listening = true;

		// Return.
		return this;
	}

	/**
	 * Apply gravity & clamp downward velocity.
	 */
	listen = () => {

		// Skip if not listening.
		if ( ! this.listening ) {
			return;
		}

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

		// Skip if maxed.
		if ( this.maxed() ) {
			return;
		}

		// Apply gravity.
		this.velocity.y += this.force();
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
		this.velocity.y = this.force();
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

	/**
	 * Get the current fall force.
	 *
	 * @returns {Number} The current fall force.
	 */
	force = () => {
		return ( Game.Gravity.force * Time.scale );
	}
}
