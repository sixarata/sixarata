import Game from '../../game.js';
import Settings from '../../../custom/settings.js';

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
		// Optional: stamina drain rate, max hold time, etc.
		// stamina: {
		//   enabled: false,
		//   drainRate: 0.1,
		//   maxDuration: Infinity,
		// }
	}

	/**
	 * Construct.
	 *
	 * @param {Tile|null} tile
	 * @returns {WallGrab} this
	 */
	constructor( tile = null ) {
		return this.set( tile );
	}

	/**
	 * Bind (or rebind) the mechanic to a tile.
	 *
	 * @param {Tile|null} tile
	 * @returns {WallGrab} this
	 */
	set = ( tile = null ) => {

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

		// Internal state for tracking grab duration, stamina, etc.
		this.grabbing = false;
		this.duration = 0;

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

		// Check if we can/should be grabbing the wall.
		if ( this.can() ) {
			this.do();
		} else {
			// Not eligible to grab, reset state.
			if ( this.grabbing ) {
				this.release();
			}
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
	 *
	 * @returns {boolean} True if conditions are met for wall grab.
	 */
	can = () => {
		if ( ! this.tile ) return false;

		const contact = this.tile.physics?.contact;

		if ( ! contact ) return false;
		if ( contact.bottom ) return false; // Can't grab while grounded.

		const holdL = Game.History.hold( 'left' );
		const holdR = Game.History.hold( 'right' );

		// Check if pressing into a wall we're touching.
		const intoLeft  = contact.left  && holdL?.down;
		const intoRight = contact.right && holdR?.down;

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

		// Mark as grabbing.
		if ( ! this.grabbing ) {
			this.grabbing = true;
			this.duration = 0;
		}

		// Increment duration (could be used for stamina/fatigue systems).
		this.duration++;

		// Optional: Apply stamina drain, grip fatigue, etc.
		// if ( this.settings.stamina?.enabled ) {
		//   this.drainStamina();
		// }
	}

	/**
	 * Release the wall grab.
	 *
	 * Called when conditions are no longer met or player lets go.
	 */
	release = () => {
		this.grabbing = false;
		this.duration = 0;
	}

	/**
	 * Get which side of the wall is being grabbed.
	 *
	 * @returns {'left'|'right'|null} The side being grabbed, or null if not grabbing.
	 */
	getSide = () => {
		if ( ! this.doing() ) return null;

		const contact = this.tile.physics?.contact;
		if ( ! contact ) return null;

		if ( contact.left ) return 'left';
		if ( contact.right ) return 'right';

		return null;
	}

	/**
	 * Check if enough stamina/duration remains for the grab.
	 *
	 * @returns {boolean} True if the grab can continue.
	 */
	hasStamina = () => {
		// For now, infinite stamina. Could implement:
		// return this.duration < ( this.settings.stamina?.maxDuration ?? Infinity );
		return true;
	}
}
