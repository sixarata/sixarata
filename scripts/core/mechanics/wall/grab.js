import Game from '../../game.js';
import Settings from '../../../content/settings.js';
import Stamina from '../stamina.js';

/**
 * The WallGrab mechanic.
 *
 * The foundational wall interaction state that must be achieved before
 * WallSlide or WallClimb can occur. When a tile is airborne and pressing
 * into a wall, they "grab" it — maintaining this neutral contact state.
 *
 * - WallGrab: Base state (holding into wall while airborne)
 * - WallClimb: WallGrab + Up input → ascend
 * - WallSlide: WallGrab + (gravity/friction/stamina drain) → descend
 *
 * In theory, a grab could last indefinitely (if stamina is infinite or
 * the tile has the ability to maintain the grip).
 */
export default class WallGrab {

	/**
	 * Default wall grab settings.
	 *
	 * @type {Object}
	 */
	static defaults = {
		enabled: true,
		stamina: {
			max:   2000,
			drain: 1,
			delay: 500,
			rate:  2,
		}
	}

	/**
	 * Construct.
	 *
	 * @param {Tile|null} tile
	 * @returns {WallGrab} this
	 */
	constructor(
		tile = null
	) {
		return this.set( tile );
	}

	/**
	 * Bind (or rebind) the mechanic to a tile.
	 *
	 * @param {Tile|null} tile
	 * @returns {WallGrab} this
	 */
	set = (
		tile = null
	) => {

		// Reset.
		this.reset();

		// Set tile.
		this.tile = tile;

		// Return.
		return this;
	}

	/**
	 * Reset internal state.
	 *
	 * @returns {WallGrab} this
	 */
	reset = () => {

		// Clear properties.
		this.tile = null;

		// Load settings.
		this.settings  = Settings.player?.wall?.grab ?? WallGrab.defaults;
		this.listening = true;

		// Internal state for tracking grab.
		this.grabbing = false;

		// Initialize stamina with settings from player.wall.grab.stamina
		this.stamina = new Stamina( this.settings.stamina );

		// Return.
		return this;
	}

	/**
	 * Primary loop hook.
	 */
	listen = () => {

		// Skip if disabled or unbound.
		if ( ! this.listening || ! this.tile ) {
			return;
		}

		// Handle stamina recharge (instant refill on ground).
		if ( this.tile?.physics?.contact?.bottom ) {
			this.stamina.refill();

		// Auto-recharge in air when not grabbing.
		} else if ( ! this.grabbing ) {
			this.stamina.listen();
		}

		// Check if we can/should be grabbing the wall.
		if ( this.can() ) {
			this.do();

		// Not eligible to grab, reset state.
		} else if ( this.grabbing ) {
			this.release();
		}
	}

	/**
	 * Are we currently grabbing a wall?
	 *
	 * @returns {boolean} True if actively grabbing.
	 */
	doing = () => {
		return this.grabbing && this.can();
	}

	/**
	 * Eligibility check.
	 *
	 * Conditions:
	 * - Tile exists and has physics/contact.
	 * - Tile is NOT grounded (airborne).
	 * - Player is in contact with left OR right wall.
	 * - Player is holding the direction INTO the wall.
	 * - Player has grip stamina available.
	 *
	 * @returns {boolean} True if conditions are met for wall grab.
	 */
	can = () => {

		// Skip if no tile.
		if ( ! this.tile ) {
			return false;
		}

		const contact = this.tile.physics?.contact;

		// Skip if no contact info.
		if ( ! contact ) {
			return false;
		}

		// Can't grab while grounded.
		if ( contact.bottom ) {
			return false;
		}

		// Can't grab without stamina.
		if ( ! this.stamina.has() ) {
			return false;
		}

		const holdL = Game.History.hold( 'left' );
		const holdR = Game.History.hold( 'right' );

		// Check if pressing into a wall we're touching.
		const intoLeft  = contact.left  && holdL?.down;
		const intoRight = contact.right && holdR?.down;

		// Return true if pressing into either side.
		return ( intoLeft || intoRight );
	}

	/**
	 * Execute the grab (maintain wall contact state).
	 *
	 * This is a neutral state — it doesn't apply forces by itself,
	 * but marks that the player is in a "grabbed" state which other
	 * mechanics (WallSlide, WallClimb) can check before acting.
	 */
	do = () => {

		// Get velocity reference
		const velocity = this.tile?.physics?.velocity;

		// Mark as grabbing.
		if ( ! this.grabbing ) {
			this.grabbing = true;

			// INITIAL GRAB: Stop all momentum immediately (only if we have stamina)
			if ( this.stamina.has() && velocity ) {
				velocity.y = 0;
			}
		}

		// Drain stamina while grabbing
		this.stamina.drain();

		// Only apply sticky grip if we have strength left
		if ( this.stamina.has() ) {

			// Check if actively climbing
			const climbing = this.tile?.mechanics?.wall?.climb?.doing();

			if ( velocity ) {
				if ( climbing ) {

					// CLIMBING: Allow upward movement, stop falling
					if ( velocity.y > 0 ) {
						velocity.y = 0;
					}
				} else {

					// SUSTAINED GRIP (not climbing): Stop all movement
					velocity.y = 0;
				}
			}
		} else {
			// Grip depleted - allow normal falling or sliding
			// The slide mechanic will handle reduced fall speed if active
		}
	}

	/**
	 * Release the wall grab.
	 *
	 * Called when conditions are no longer met or player lets go.
	 */
	release = () => {
		this.grabbing = false;
	}

	/**
	 * Check if the grip is still active (player is grabbing AND has stamina).
	 *
	 * @returns {boolean} True if actively gripping with stamina, false otherwise.
	 */
	gripping = () => {
		return this.grabbing && this.stamina.has();
	}
}
