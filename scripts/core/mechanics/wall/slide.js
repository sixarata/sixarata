import Settings from '../../../custom/settings.js';
import Game from '../../game.js';
import Time from '../../utilities/time.js';

/**
 * The WallSlide mechanic.
 *
 * Applies a reduced gravity (vertical velocity dampening) while the player is
 * holding toward a wall they are currently in lateral contact with. This
 * creates a controllable descent (wall slide) prior to performing a wall jump
 * or releasing to free‑fall.
 */
export default class WallSlide {

	/**
	 * Default wall slide settings.
	 *
	 * @type {Object}
	 */
	static defaults = {
		factor: 0.35,
		max: 15,
	}

	/**
	 * Construct.
     *
	 * @param {Tile|null} tile
	 * @returns {WallSlide} this
	 */
	constructor( tile = null ) {
		return this.set( tile );
	}

	/**
	 * Bind (or rebind) the mechanic to a tile.
     *
	 * @param {Tile|null} tile
	 * @returns {WallSlide} this
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
	 * @returns {WallSlide} this
	 */
	reset = () => {

		// Clear properties.
		this.tile = null;

		// Load settings.
		this.settings  = Settings.player?.jumps?.wall?.slide ?? WallSlide.defaults;
		this.listening = true;

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

		// Check if we can perform a wall slide.
		if ( this.can() ) {
			this.do();
		}
	}

	/**
	 * Are we currently performing a wall slide?
	 */
	doing = () => {
		return this.can();
	}

	/**
	 * Eligibility check.
	 * Conditions:
	 * - Tile exists and has physics/contact.
	 * - Tile is NOT grounded.
	 * - Player is in contact with left OR right wall (exclusive or both).
	 * - Player is holding the direction INTO the wall (e.g. holding 'left' while in left contact).
	 * - Vertical velocity is downward (y > 0) OR zero (allow initial engage before falling).
	 */
	can = () => {
		if ( ! this.tile ) return false;

		const contact = this.tile.physics?.contact;

		if ( ! contact ) return false;
		if ( contact.bottom ) return false; // grounded

		const holdL = Game.History.hold( 'left' );
		const holdR = Game.History.hold( 'right' );

		const intoLeft  = contact.left  && holdL?.down;
		const intoRight = contact.right && holdR?.down;

		if ( ! ( intoLeft || intoRight ) ) return false;

		// Must be descending or neutral; if moving upward strongly (e.g., after jump) skip.
		const velocity = this.tile.physics?.velocity;
		const vy = velocity?.y ?? 0;
		return ( vy >= 0 );
	}

	/**
	 * Apply slide dampening (reduced gravity application).
	 */
	do = () => {

		// Get velocity reference.
		const velocity = this.tile?.physics?.velocity;

		// Skip if no velocity.
		if ( ! velocity ) {
			return;
		}

		const gravity = Game.Gravity.force;
		const inc = gravity * this.settings.factor * Time.scale;

		if ( velocity.y < this.settings.max ) {
			velocity.y += inc;

			if ( velocity.y > this.settings.max ) {
				velocity.y = this.settings.max;
			}

		} else if ( velocity.y > this.settings.max ) {
			velocity.y = this.settings.max;
		}
	}
}
