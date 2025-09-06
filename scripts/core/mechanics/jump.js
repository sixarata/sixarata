import Game from '../game.js';
import Settings from '../../custom/settings.js';

/**
 * The Jump mechanic.
 *
 * Handles jump triggering (input -> upward impulse) and hook filtering.
 * Gravity logic is managed by the Fall mechanic.
 */
export default class Jump {

	/**
	 * Construct the Jump mechanic.
	 *
	 * @param {Tile} tile A Tile with `velocity`, `contact`, `jumps`, etc.
	 */
	constructor(
		tile = null
	) {
		this.set( tile );
	}

	/**
	 * Set the mechanic.
	 *
	 * @param {Tile} tile A Tile with `velocity`, `contact`, `jumps`, etc.
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
		this.tile      = null;
		this.count     = 0;
		this.listening = true;
		this.settings  = Settings.player.jumps.ground;
	}

	/**
	 * Listen for jump input.
	 */
	listen = () => {

		// Skip if not listening.
		if ( ! this.listening ) {
			return;
		}

		// Reset jump count if just landed.
		if ( this.landed() ) {
			this.count = 0;
		}

		// Do the jump.
		if ( this.doing() ) {
			this.do();
		}
	}

	/**
	 * Check if the mechanic is being done.
	 *
	 * @returns {Boolean} True if the mechanic is being done, false otherwise.
	 */
	doing = () => {

		// Skip if can't.
		if ( ! this.can() ) {
			return false;
		}

		// Use global edge detection: only first frame of press
		return Game.History.edge( 'jump' );
	}

	/**
     * Determine if tile can jump.
	 *
	 * @returns {Boolean} True if tile can jump, false otherwise.
     */
	can = () => {
		return (
			this.grounded()
			||
			! this.maxed()
		);
	}

	/**
	 * Do the jump.
	 */
	do = () => {
		const velocity = this.tile?.physics?.velocity || {};

		// Increment jump count.
		this.count++;

		// Apply jump impulse to velocity.
		velocity.y = -this.settings.power.min;
	}

	/**
	 * Check if tile is on the ground.
	 *
	 * @returns {Boolean} True if tile is on the ground, false otherwise.
	 */
	grounded = () => {
		return Boolean( this.tile?.physics?.contact?.bottom );
	}

	/**
	 * Check if tile has reached max jump count.
	 *
	 * @returns {Boolean} True if max jump count is reached, false otherwise.
	 */
	maxed = () => {
		return Boolean( this.count >= this.settings.count.max );
	}

	/**
	 * Check if tile has just landed.
	 *
	 * @returns {Boolean} True if tile has just landed, false otherwise.
	 */
	landed = () => {
		return (
			this.grounded()
			&&
			( this.count > 0 )
		);
	}

	/**
	 * Determine if tile is free-falling.
	 *
	 * No jumps, but also not on ground.
	 *
	 * @returns {Boolean} True if tile is free-falling, false otherwise.
	 */
	freefall = () => {
		return (
			! this.count
			&&
			! this.grounded()
		);
	}
}
