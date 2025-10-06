import Game from '../../game.js';
import Settings from '../../../custom/settings.js';
import Timer from '../../utilities/timer.js';

/**
 * The WallJump mechanic.
 *
 * Responsible for determining whether a tile is eligible to perform a wall jump
 * and, when invoked, applying BOTH the vertical and horizontal impulses
 * required for the maneuver (making this mechanic self‑sufficient).
 */
export default class WallJump {

	/**
	 * Default wall jump settings.
	 *
	 * @type {Object}
	 */
	static defaults = {
		power: 18,
		lateral: 18,
		time: 100,
	}

	/**
	 * Construct the WallJump mechanic.
	 *
	 * @param {Tile|null} tile Optional tile to bind immediately.
	 * @returns {WallJump} this
	 */
	constructor(
		tile = null
	) {
		return this.set( tile );
	}

	/**
	 * Bind (or rebind) the mechanic to a tile.
	 *
	 * Resets internal state first to avoid leaking references.
	 *
	 * @param {Tile|null} tile Tile providing physics + jumps configuration.
	 * @returns {WallJump} this
	 */
	set = (
		tile = null
	) => {
		this.reset();

		// Set properties.
		this.tile = tile;

		// Return.
		return this;
	}

	/**
	 * Reset internal references back to an inert state.
	 *
	 * @returns {WallJump} this
	 */
	reset = () => {
		this.tile      = null;
		this.settings  = Settings.player?.jumps?.wall ?? WallJump.defaults;
		this.listening = true;
		this.impulse   = new Timer();

		// Return.
		return this;
	}

	/**
	 * Listen for wall jump input.
	 */
	listen = () => {

		// Skip if not listening.
		if ( ! this.listening ) {
			return;
		}

		// Release lock if impulse expired.
		if ( this.impulse.done() ) {
			this.ignore( true );
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

		// Use edge detection to only trigger once per press.
		return Game.History.edge( 'jump' );
	}

	/**
	 * Determine if the tile is allowed to execute a wall jump on this frame.
	 *
	 * Conditions:
	 * - Wall jumping enabled in this.settings.power.
	 * - Tile is NOT grounded (forces usage only while airborne beside a wall).
	 * - Tile is touching a wall side (left or right contact flag).
	 *
	 * @returns {Boolean} True when a wall jump may be initiated.
	 */
	can = () => {

		// Conditions.
		const set      = this.settings.power;
		const walled   = this.walled();
		const grounded = this.tile?.mechanics?.jump?.grounded() || false;

		// Return eligibility.
		return (
			! grounded
			&&
			(
				set
				&&
				walled
			)
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
	 *
	 * @returns {void}
	 */
	do = () => {

		// Various values, for maths.
		const velocity = this.tile.physics.velocity;
		const contact  = this.tile.physics.contact;

		// Horizontal.
		if ( contact.left ) {
			velocity.x = this.settings.lateral;
		} else if ( contact.right ) {
			velocity.x = -this.settings.lateral;
		}

		// Vertical (slightly boosted for wall jump flair).
		velocity.y = -this.settings.power;

		// Set the impulse timer.
		this.impulse.set( this.settings.time );
		this.ignore( false );
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
		return ( contact.left || contact.right );
	}

	/**
	 * Enable / disable overlapping locomotion mechanics while walljumping.
	 *
	 * @param {Boolean} enable True to restore, false to suspend.
	 */
	ignore = ( enable = true ) => {
		const m = this.tile?.mechanics;

		// Skip if no mechanics.
		if ( ! m ) {
			return;
		}

		// Enable/disable other mechanics.
		if ( m.jump )     m.jump.listening     = enable;
		if ( m.fall )     m.fall.listening     = enable;
		if ( m.walljump ) m.walljump.listening = enable;
		if ( m.slide )    m.slide.listening    = enable;
		if ( m.coyote )   m.coyote.listening   = enable;
		if ( m.orient )   m.orient.listening   = enable;

		// Disable walk sub-mechanics.
		const walk = this.tile.mechanics?.walk;

		if ( walk ) {
			for ( const key of Object.keys( walk ) ) {
				const s = walk[ key ];

				if ( s && s.listening !== undefined ) {
					s.listening = enable;
				}
			}
		}
	}
}
