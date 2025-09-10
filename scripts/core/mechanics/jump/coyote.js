import Settings from '../../../custom/settings.js';
import Tile from '../../tiles/tile.js';
import Timer from '../../utilities/timer.js';
import Game from '../../game.js';

/**
 * The Coyote mechanic.
 *
 * Tracks coyote jump eligibility within a short grace window after leaving
 * the ground, enabling late jump forgiveness.
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
		this.tile        = null;
		this.listening   = true;
		this.settings    = Settings.player.jumps.coyote;
		this.freefall    = new Timer();
		this.wasOnGround = false;
	}

	/**
	 * Listen for coyote logic.
	 */
	listen = () => {

        // Bail if not listening or no tile present
		if ( ! this.listening || ! this.tile ) {
			return;
		}

		this.idle();

		if ( this.doing() ) {
			this.do();
		}
	}

	/**
	 * Check if mechanic is being done.
	 *
	 * @returns {Boolean}
	 */
	doing = () => {
		return ( this.can() && Game.Inputs.pressed( 'jump' ) );
	}

	/**
	 * Determine if coyote jump can occur.
	 *
	 * @returns {Boolean}
	 */
	can = () => {

        // Skip if not in freefall.
		if ( ! this.freefall.active() ) {
			return false;
		}

        // Skip if on ground.
		if ( this.grounded() ) {
			return false;
		}

        // Skip if jump is already available.
		if ( this.tile?.mechanics?.jump?.can?.() ) {
			return false;
		}

        // Skip if jump count is greater than 0.
		if ( this.jumpcount() > 0 ) {
			return false;
		}

		return true;
	}

	/**
	 * Execute the coyote jump.
	 */
	do = () => {
		this.wasOnGround = false;
		this.freefall.clear();

        // Execute jump if not already done.
		if ( ! this.jumpcount() ) {
			this.tile?.mechanics?.jump?.do();
		}
	}

	/**
	 * Idle logic updates timers and ground state.
	 */
	idle = () => {
		const bottom = this.grounded() || false;

        // On ground.
		if ( bottom ) {
			this.wasOnGround = true;
			this.freefall.clear();
			return;
		}

        // Was on ground.
		if ( this.wasOnGround ) {
			this.wasOnGround = false;
			this.freefall.set( this.settings.time );
		}
	}

    /**
     * Check if the player is grounded.
     *
     * @returns {Boolean}
     */
    grounded = () => {
		return ( this.tile?.physics?.contact?.bottom || false );
	}

	/**
	 * Jump count helper.
	 *
	 * @returns {Number}
	 */
	jumpcount = () => {
		return ( this.tile?.mechanics?.jump?.count || 0 );
	}
}
