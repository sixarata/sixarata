import Settings from '../../custom/settings.js';
import Tile from '../tiles/tile.js';
import Timer from '../utilities/timer.js';
import Game from '../game.js';

/**
 * Coyote mechanic (arrow property version).
 *
 * Tracks coyote jump eligibility and timer for a given tile.
 * Provides a standalone listen() method for per-frame updates.
 */
export default class Coyote {

	/**
	 * Construct the Coyote mechanic.
	 *
	 * @param {Tile} tile A Tile with a `physics` property.
	 */
	constructor(
		tile = null
	) {
		this.set( tile );
	}

	/**
	 * Set the mechanic.
	 *
	 * @param {Tile} tile A Tile with a `physics` property.
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
		this.tile		= null;
		this.listening   = true;
		this.settings	= Settings.player.jumps.coyote;
		this.freefall	= new Timer();
		this.wasOnGround = false;
	}

	/**
	 * Standalone listener for coyote logic. Call once per frame.
	 */
	listen = () => {

		// Skip if not listening.
		if ( ! this.listening ) {
			return;
		}

		// Skip if no tile.
		if ( ! this.tile ) {
			return;
		}

		// Idling.
		this.idle();

		// Execute jump.
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
		return ( this.can() && Game.Inputs.pressed( 'jump' ) );
	}

	/**
	 * Determine if the tile is allowed to execute a coyote jump on this frame.
	 *
	 * Conditions:
	 * - Freefall timer active (just left ground recently)
	 * - No jumps consumed yet in this airtime
	 * - Tile is NOT grounded
	 *
	 * @returns {Boolean} True when a coyote jump may be initiated.
	 */
	can = () => {

		// Eligible only while coyote timer active...
		if ( ! this.freefall.active() ) {
			return false;
		}

		// ...and not currently grounded.
		if ( this.tile?.physics?.contact?.bottom ) {
			return false;
		}

		// Prevent overlap if a normal jump is somehow still allowed.
		if ( this.tile?.mechanics?.jump?.can?.() ) {
			return false;
		}

		// Prevent instant double-jump.
		if ( this.jumpcount() > 0 ) {
			return false;
		}

		// If all checks pass, coyote jump is doable.
		return true;
	}

	/**
	 * Execute the coyote jump.
	 */
	do = () => {

		// Not on ground anymore.
		this.wasOnGround = false;

		// Restart the freefall timer.
		this.freefall.clear();

		// Execute the jump mechanic if no jump was used yet.
		if ( ! this.jumpcount() ) {
			this.tile?.mechanics?.jump?.do();
		}
	}

	/**
	 * Standalone idle logic for coyote mechanic.
	 */
	idle = () => {

		// Get the current tile contact state.
		const bottom = this.tile?.physics?.contact?.bottom || false;

		// Not on ground.
		if ( ! bottom ) {

			// Only just left the ground this frame
			if ( this.wasOnGround ) {
				this.freefall.set( this.settings.time );
			}

		// On ground, so reset the coyote timer.
		} else {
			this.freefall.clear();
		}

		// Update the ground state.
		this.wasOnGround = !! bottom;
	}

	/**
	 * Get the current jump count.
	 *
	 * @returns {Number} The current jump count.
	 */
	jumpcount = () => {
		return ( this.tile?.mechanics?.jump?.count ?? 0 );
	}
}
