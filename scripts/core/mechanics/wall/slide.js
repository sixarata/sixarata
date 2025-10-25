import Settings from '../../../content/settings.js';
import Game from '../../game.js';
import Time from '../../utilities/time.js';

/**
 * The WallSlide mechanic.
 *
 * Applies a reduced gravity (vertical velocity dampening) while the player is
 * holding toward a wall they are currently in lateral contact with. This
 * creates a controllable descent (wall slide) prior to performing a wall jump
 * or releasing to free‑fall.
 *
 * NOTE: WallSlide requires an active WallGrab as its base state.
 * Sliding occurs as a result of gravity/friction acting on the grab,
 * potentially after stamina has expired or by default.
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
	constructor(
		tile = null
	) {
		return this.set( tile );
	}

	/**
	 * Bind (or rebind) the mechanic to a tile.
     *
	 * @param {Tile|null} tile
	 * @returns {WallSlide} this
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
	 *
	 * @returns {void}
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
	 *
	 * @returns {boolean} True if doing the wall slide.
	 */
	doing = () => {
		return this.can();
	}

	/**
	 * Eligibility check.
	 * Conditions:
	 * - Must have an active WallGrab (base requirement).
	 * - Grip timer must have expired (gripping() returns false).
	 * - Vertical velocity is downward (y > 0) OR zero (allow initial engage before falling).
	 *
	 * The wall contact and directional input checks are handled by WallGrab.
	 *
	 * @returns {boolean} True if conditions are met for wall slide.
	 */
	can = () => {

		// Skip if no tile.
		if ( ! this.tile ) {
			return false;
		}

		// First check: Must be actively grabbing a wall.
		const grab = this.tile.mechanics?.wall?.grab;
		if ( ! grab || ! grab.doing() ) {
			return false;
		}

		// Second check: Grip timer must have expired before sliding
		if ( grab.gripping() ) {
			return false;
		}

		// Must be descending or neutral; if moving upward strongly (e.g., after jump) skip.
		const velocity = this.tile.physics?.velocity;
		const vy = velocity?.y ?? 0;

		// Return true if descending or neutral.
		return ( vy >= 0 );
	}

	/**
	 * Apply slide dampening (reduced gravity application).
	 *
	 * @returns {void}
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
