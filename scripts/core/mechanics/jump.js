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
		this.tile     = null;
		this.count    = 0;
		this.settings = Settings.player.jumps;
	}

	/**
	 * Process jump input (assumes Fall mechanic has already applied gravity).
	 */
	listen = () => {

		// Reset jump count if grounded.
		if ( this.grounded() ) {
			this.count = 0;
		}

		// Bail if not jumping.
		if ( ! this.doing() ) {
			return;
		}

		// Do the jump.
		this.do();
	}

	/**
	 * Check if the mechanic is being done.
	 *
	 * @returns {Boolean} True if the mechanic is being done, false otherwise.
	 */
	doing = () => {

        // Bail if can't.
		if ( ! this.can() ) {
			return false;
		}

		// Return if jump button is pressed.
		return Game.Inputs.pressed( 'jump' );
	}

	/**
     * Determine if tile can jump.
     */
	can = () => {

        // Bail if no tile.
		if ( ! this.tile ) {
			return false;
		}

		const grounded = this.grounded();
		const freefall = this.freefall();
		const maxed    = this.maxed();

		// Check if can jump.
		return (
			! maxed
			&&
			(
				grounded
			)
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
		velocity.y = -this.settings.power;
	}

	/**
	 * Check if tile is grounded (on the ground).
	 *
	 * @returns {Boolean} True if tile is grounded, false otherwise.
	 */
	grounded = () => {
		return ( this.tile?.physics?.contact?.bottom );
	}

	/**
	 * Determine if tile is free-falling.
	 *
	 * No jumps, but also not on ground.
	 */
	freefall = () => {
		return (
			! this.count
			&&
			! this.grounded()
		);
	}

	/**
	 * Check if tile has reached max jump count.
	 *
	 * @returns {Boolean} True if max jump count is reached, false otherwise.
	 */
	maxed = () => {
		return ( this.count > this.settings.max );
	}
}
