import Settings from '../../custom/settings.js';
import Tile from '../tiles/tile.js';
import Time from '../utilities/time.js';
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
        this.tile        = null;
        this.listening   = true;
        this.settings    = Settings.player.jumps.coyote;
        this.freefall    = new Timer();
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
	 * - Freefalling
     * - No jumps
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

        // Prevent double-using if a normal jump is still allowed.
        if ( this.tile?.mechanics?.jump?.can?.() ) {
            return false;
        }

        // If all checks pass, coyote jump is allowed.
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

        // Execute the jump mechanic.
        this.tile?.mechanics?.jump?.do();
    }

    /**
     * Standalone idle logic for coyote mechanic.
     */
    idle = () => {

        // Get the current tile contact state.
        const contact = this.tile?.physics?.contact || {};

        // If landed, reset coyote timer.
        if ( contact.bottom ) {
            this.freefall.clear();
        }

        // If just left ground this frame:
        // - (re)start window regardless of jump input
        // - jump mechanic will consume if pressed
        if ( this.wasOnGround && ! contact.bottom ) {
            this.freefall.set( this.settings.time );
        }

        this.wasOnGround = !! contact.bottom;
    }
}
