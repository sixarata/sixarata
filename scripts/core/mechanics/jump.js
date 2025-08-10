import Game from '../game.js';

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
		this.tile = null;
	}

	/**
	 * Process jump input (assumes Fall mechanic has already applied gravity).
	 */
	listen = () => {

		// Jumping
		if ( ! this.doing() ) {
			return;
		}

		const velocity = this.tile.physics?.velocity || {};

		this.tile.jumps.current++;
		velocity.y = -this.tile.jumps.power;
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

		const contact = this.tile.physics?.contact || {};

		return (
			! this.falling()
			&&
			this.tile.jumps.max
			&&
			(
				contact.bottom
				||
				( this.tile.jumps.current < this.tile.jumps.max )
			)
		);
	}

	/**
	 * Determine if tile is falling (no jumps yet & not on ground).
	 */
	falling = () => {
		const contact = this.tile.physics?.contact || {}

		return (
			! this.tile.jumps.current
			&&
			! contact.bottom
		);
	}
}
