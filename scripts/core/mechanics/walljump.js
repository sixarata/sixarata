import Game from '../game.js';

/**
 * The WallJump mechanic.
 *
 * Responsible for determining whether a tile (typically the player) is eligible to
 * perform a wall jump and, when invoked, applying BOTH the vertical and horizontal
 * impulses required for the maneuver (making this mechanic self‑sufficient).
 *
 * Design Notes:
 * - Self contained: handles input -> eligibility -> vertical + horizontal impulses.
 * - Lateral force magnitude derived from jump power to keep tuning centralized.
 * - If future systems (e.g., stamina) need to veto wall jumps, they can wrap or override can().
 */
export default class WallJump {

	/**
	 * Construct the WallJump mechanic.
	 *
	 * @param {Tile|null} tile Optional tile to bind immediately.
	 */
	constructor(
		tile = null
	) {
		this.set( tile );
	}

	/**
	 * Bind (or rebind) the mechanic to a tile.
	 * Resets internal state first to avoid leaking references.
	 *
	 * @param {Tile|null} tile Tile providing physics + jumps configuration.
	 * @returns {void}
	 */
	set = (
		tile = null
	) => {
		this.reset();
		this.tile = tile;
	}

	/**
	 * Reset internal references back to an inert state.
	 * Useful when recycling objects or clearing between room loads.
	 *
	 * @returns {void}
	 */
	reset = () => {
		this.tile = null;
	}

	/**
	 * Main update hook.
	 *
	 * @returns {void}
	 */
	listen = () => {

		// Bail if not bound to a tile.
		if ( ! this.tile ) {
			return;
		}

		// Bail if wall jumping is not allowed.
		if ( ! this.can() ) {
			return;
		}

		// Bail if jump button is not pressed.
		if ( ! Game?.Inputs?.pressed?.( 'jump' ) ) {
			return;
		}

		// Horizontal impulse.
		this.impulse();
	}

	/**
	 * Determine if the tile is allowed to execute a wall jump on this frame.
	 *
	 * Conditions:
	 * - Mechanic bound to a tile.
	 * - Wall jumping enabled in tile.jumps.wall.
	 * - A maximum jump count (jumps.max) is defined (prevents unlimited air actions when disabled).
	 * - Tile is NOT grounded (forces usage only while airborne beside a wall).
	 * - Tile is touching a wall side (left or right contact flag).
	 *
	 * @returns {Boolean} True when a wall jump may be initiated.
	 */
	can = () => {

        // Bail if not bound to a tile.
		if ( ! this.tile ) {
			return false;
		}

        // Check for contact information.
		const contact = this.tile.physics?.contact;

        // Bail if no contact information.
		if ( ! contact ) {
			return false;
		}

        // Get the jumps configuration.
		const j = this.tile.jumps;

		return (
			!! j.wall
			&&
			!! j.max
			&&
			! contact.bottom
			&&
			( contact.left || contact.right )
		);
	}

	/**
	 * Apply the horizontal impulse away from the contacted wall.
	 * Called AFTER the Jump mechanic supplies the vertical impulse.
	 *
	 * Behavior:
	 * - Magnitude: 40% of vertical jump power
	 * - Direction: Opposite the contacting wall. If both sides somehow reported,
	 *   left contact is prioritized.
	 * - Side effects only occur if eligibility still passes at the moment of calling.
	 *
	 * @returns {void}
	 */
	impulse = () => {

        // Bail if not eligible.
		if ( ! this.can() ) {
			return;
		}

		const v       = this.tile.physics.velocity;
		const contact = this.tile.physics.contact;
		const power   = this.tile.jumps.power || 0;
		const lateral = power * 0.75;

		// Horizontal.
		if ( contact.left ) {
			v.x = lateral;
		} else if ( contact.right ) {
			v.x = -lateral;
		}

		// Vertical (slightly boosted for wall jump flair).
		v.y = -( this.tile.jumps.power * 1.1 );
	}
}
