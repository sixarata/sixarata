import Game from '../game.js';
import Settings from '../../custom/settings.js';

/**
 * The WallJump mechanic.
 *
 * Responsible for determining whether a tile is eligible to perform a wall jump
 * and, when invoked, applying BOTH the vertical and horizontal impulses
 * required for the maneuver (making this mechanic self‑sufficient).
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
	 *
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
	 */
	reset = () => {
		this.tile      = null;
		this.settings  = Settings.player.jumps.wall;
		this.listening = true;
	}

	/**
	 * Listen for wall jump input.
	 */
	listen = () => {

		// Skip if not listening.
		if ( ! this.listening ) {
			return;
		}

		// Do the wall jump.
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

		// Skip if can't.
		if ( ! this.can() ) {
			return false;
		}

		// Return if jump button is pressed.
		return Game.Inputs.pressed( 'jump' );
	}

	/**
	 * Determine if the tile is allowed to execute a wall jump on this frame.
	 *
	 * Conditions:
	 * - Wall jumping enabled in this.settings.power.
	 * - A maximum jump count (this.settings.max) is defined (prevents unlimited air actions when disabled).
	 * - Tile is NOT grounded (forces usage only while airborne beside a wall).
	 * - Tile is touching a wall side (left or right contact flag).
	 *
	 * @returns {Boolean} True when a wall jump may be initiated.
	 */
	can = () => {

		// Conditions.
		const set      = ( this.settings.power && this.settings.max );
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
	 * Do the wall jump.
	 *
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
	do = () => {

		// Various values, for maths.
		const velocity = this.tile.physics.velocity;
		const contact  = this.tile.physics.contact;
		const power    = this.settings.power || 18;
		const lateral  = this.settings.lateral || 18;

		// Horizontal.
		if ( contact.left ) {
			velocity.x = lateral;
		} else if ( contact.right ) {
			velocity.x = -( lateral);
		}

		// Vertical (slightly boosted for wall jump flair).
		velocity.y = -( power );
	}

	/**
	 * Check if the tile is touching a wall.
	 *
	 * @returns {Boolean} True if the tile is walled, false otherwise.
	 */
	walled = () => {

		// Check for contact information.
		const contact = this.tile.physics?.contact;

		// Skip if no contact information.
		if ( ! contact ) {
			return false;
		}

		// Return wall contact status.
		return ( contact.left || contact.right )
	}
}
