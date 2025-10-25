import Game from '../game.js';
import Settings from '../../content/settings.js';
import Time from '../utilities/time.js';

/**
 * The Fall mechanic.
 *
 * Applies gravity and clamps vertical (downward) velocity.
 */
export default class Fall {

	/**
	 * Default fall settings.
	 *
	 * @type {Object}
	 */
	static defaults = {
		speed: 20,
		terminal: 20,
	}

	/**
	 * Construct the Fall mechanic.
	 *
	 * @param {Tile} tile A Tile with `velocity`, `contact`, `jumps`.
	 * @returns {Fall} this
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
	 * @returns {Fall} this
	 */
	set = (
		tile = null
	) => {
		this.reset();

		// Set properties.
		this.tile = tile;

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
		this.settings  = Settings.player.jumps?.fall ?? Fall.defaults;
		this.listening = true;

		// Return.
		return this;
	}

	/**
	 * Apply gravity & clamp downward velocity.
	 */
	listen = () => {

		// Skip if disabled or unbound.
		if ( ! this.listening || ! this.tile ) {
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
		const velocity = this.tile?.physics?.velocity;
		if ( velocity && this.maxed() ) {
			velocity.y = this.settings.terminal;
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

		// Get velocity reference.
		const velocity = this.tile?.physics?.velocity;

		// Skip if no velocity.
		if ( ! velocity ) {
			return;
		}

		// Apply gravity.
		velocity.y += this.force();
	}

	/**
	 * Check if tile has reached max fall speed.
	 *
	 * @returns {Boolean} True if max fall speed is reached, false otherwise.
	 */
	maxed = () => {
		const velocity = this.tile?.physics?.velocity;

		return velocity
			? ( velocity.y >= this.settings.terminal )
			: false;
	}

	/**
	 * Tile is not falling.
	 *
	 * Apply base gravity force.
	 */
	idle = () => {
		const velocity = this.tile?.physics?.velocity;

		// Skip if no velocity.
		if ( ! velocity ) {
			return;
		}

		velocity.y = this.force();
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
