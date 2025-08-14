import Settings from '../../custom/settings.js';
import Tile from '../tiles/tile.js';

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
        this.timer       = 0;
        this.settings    = Settings.player.jumps.coyote;
        this.wasOnGround = false;
    }

	/**
	 * Listen for coyote jump input.
	 */
	listen = () => {

		// Do the coyote jump.
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

		// Bail if can't.
		if ( ! this.can() ) {
			return false;
		}

		// Return if jump button is pressed.
		return Game.Inputs.pressed( 'jump' );
	}

	/**
	 * Determine if the tile is allowed to execute a coyote jump on this frame.
	 *
	 * Conditions:
	 * - Coyote jumping enabled in this.settings.coyote.
	 * - Tile is NOT grounded (forces usage only while airborne beside a wall).
	 *
	 * @returns {Boolean} True when a coyote jump may be initiated.
	 */
	can = () => {

		// Conditions.
		const set      = ( this.settings.coyote && this.settings.max );
		const walled   = this.walled();
		const grounded = this.tile?.mechanics?.jump?.grounded() || false;

		// Return eligibility.
		return (
			! grounded
			&&
			( set && walled )
		);
	}

    /**
     * Standalone listener for coyote logic. Call once per frame.
     */
    listen = () => {

        // Bail if no tile is set.
        if ( ! this.tile ) {
            return;
        }

        const contact  = this.tile?.physics?.contact || {};
        const now      = performance.now();
        const duration = this.settings.time;

        // If just left ground, start coyote timer
        if ( this.wasOnGround && ! contact.bottom ) {
            this.timer = now + duration;
        }

        // If landed, reset coyote timer
        if ( contact.bottom ) {
            this.timer = 0;
        }

        this.wasOnGround = !! contact.bottom;
    }

    /**
     * Returns true if coyote jump is currently allowed.
     */
    active = () => {

        // Bail if no tile is set.
        if ( ! this.tile ) {
            return false
        };

        const now = performance.now();

        return this.timer && ( now < this.timer );
    }

    /**
     * Consume coyote timer (call after jump).
     */
    consume = () => {
        this.timer = 0;
    }
}
