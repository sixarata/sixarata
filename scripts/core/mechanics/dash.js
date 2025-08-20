import Game from '../game.js';
import Settings from '../../custom/settings.js';
import Timer from '../utilities/timer.js';

/**
 * Dash mechanic
 *
 * Responsibilities:
 * - Consumes combo trigger events (from Controls / Combo system).
 * - Validates dash eligibility (cooldown, limit, air permissions).
 * - Applies directional velocity impulse with temporary movement lockout.
 * - Restores normal movement mechanics when dash concludes.
 *
 * Lifecycle Notes:
 * - Use `hooks()` once after Player/mechanics setup to register combo listener.
 * - Call `listen()` each frame so natural expiration (time based) can occur.
 * - Query `doing()` to know if currently dashing; `can(dir)` to test future dash.
 */
export default class Dash {

	/**
	 * Construct the Dash mechanic.
	 *
	 * @param {Tile|null} tile Optional tile to bind immediately.
	 */
	constructor(
		tile = null
	) {
		this.set( tile );
	}

	/**
	 * Bind (or re‑bind) the mechanic to a tile.
	 * Resets internal state first to avoid stale references.
	 *
	 * @param {Tile|null} tile Tile that owns this mechanic.
	 */
	set = (
		tile = null
	) => {
		this.reset();
		this.tile = tile;
	}

	/**
	 * Reset internal state to defaults.
	 */
	reset = () => {

		// Attributes.
		this.tile      = null;
		this.settings  = Settings.player.dash;
		this.listening = true;
		this.uses      = 0;

		// Timers.
		this.impulse   = new Timer();
		this.hover     = new Timer();
		this.cool      = new Timer();
	}

	/**
	 * Per‑frame housekeeping.
	 * - expires active dash
	 * - resets use counter
	 *
	 * Should be invoked once per frame, before velocity integration.
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

		if (

			// Maybe reset use counter when grounded.
			(
				this.settings.reset.ground
				&&
				this.tile.mechanics.jump.grounded()
			)

			||

			// Maybe reset use counter when walled.
			(
				this.settings.reset.wall
				&&
				this.tile.mechanics.wall.walled()
			)
		) {
			this.uses = 0;
		}

		// While impulse active we exit early.
		if ( this.impulse.active() ) {
			return;
		}

		// Impulse just ended.
		if (
			this.impulse.done()
			&&
			this.hover.active()
		) {
			const v = this.tile?.physics?.velocity;
			if ( v && ( v.x !== 0 || v.y !== 0 ) ) {
				v.x = 0;
				v.y = 0;
			}
		}

		// Hover lockout.
		if ( this.hover.active() ) {
			return;

		// Hover existed and ended.
		} else if ( this.hover.done() ) {
			this.hover.clear();
			this.ignore( true );
		}
	}

	/**
	 * Register the combo trigger listener.
	 */
	hooks = () => {
		Game.Hooks.add( 'Combo.trigger', this.combo );
	}

	/**
	 * Combo hook callback.
	 *
	 * Translates combo name -> direction and initiates dash.
	 *
	 * @param {String} name  Combo identifier.
	 * @param {Object} data  Additional combo metadata (unused presently).
	 */
	combo = (
		name = '',
		data = {}
	) => {

		// Skip if not listening.
		if ( ! this.listening ) {
			return;
		}

		// Map combo name to direction.
		let dir = '';
		if ( name === 'dashLeft' ) {
			dir = 'left';
		} else if ( name === 'dashRight' ) {
			dir = 'right';
		} else if ( name === 'dashUp' ) {
			dir = 'up';
		} else if ( name === 'dashDown' ) {
			dir = 'down';
		} else {
			return; // Not a dash combo.
		}

		// Eligibility gate.
		if ( ! this.can( dir ) ) {
			return;
		}

		// Execute.
		this.do( dir );
	}

	/**
	 * Determine if a dash can begin.
	 *
	 * In the specified direction at a given timestamp.
	 *
	 * @param   {String}  dir Direction: 'left'|'right'|'up'|'down'.
	 * @returns {Boolean} True if dash is permitted.
	 */
	can = (
		dir = ''
	) => {

		// Skip if not listening.
		if ( ! this.listening ) {
			return false;
		}

		// Skip if no tile.
		if ( ! this.tile ) {
			return false;
		}

		// Skip if already dashing.
		if ( this.impulse.active() ) {
			return false;
		}

		// Skip if not cooled down.
		if ( this.cool.active() ) {
			return false;
		}

		// Skip if maxed uses.
		if ( this.maxed() ) {
			return false;
		}

		// Skip if no mid-air.
		if (
			! this.settings.air
			&&
			! this.tile.mechanics.jump.grounded()
		) {
			return false;
		}

		// Return default of true.
		return true;
	}

	/**
	 * Check if the dash has reached its maximum uses.
	 *
	 * @returns {Boolean} True if dash has maxed out.
	 */
	maxed = () => {
		return ( this.uses >= this.settings.limit );
	}

	/**
	 * Whether the dash is currently active (in progress).
	 *
	 * @returns {Boolean}
	 */
	doing = (
		dir = ''
	) => {

		// Skip if can't.
		if ( ! this.can( dir ) ) {
			return false;
		}

		// Execute dash.
		this.do( dir );

		// Return if impulse is active.
		return this.impulse.active();
	}

	/**
	 * Do the dash.
	 *
	 * Apply velocity impulse, start timers, and suspend some other mechanics.
	 *
	 * @param {String} dir Direction of dash.
	 */
	do = (
		dir = ''
	) => {

		// Get velocity.
		const v = this.tile?.physics?.velocity;

		// Skip if no velocity.
		if ( ! v ) {
			return;
		}

		// Activate state.
		this.uses++;

		// Update timers.
		this.impulse.set( this.settings.duration );
		this.hover.set( this.settings.duration + this.settings.hover );
		this.cool.set( this.settings.cooldown );

		// Reset motion before impulse.
		v.x = 0;
		v.y = 0;

		// Horizontal.
		if ( dir === 'left' ) {
			v.x = -( this.settings.xpower );
		} else if ( dir === 'right' ) {
			v.x = this.settings.xpower;

		// Vertical.
		} else if ( dir === 'up' ) {
			v.y = -( this.settings.ypower );
		} else if ( dir === 'down' ) {
			v.y = this.settings.ypower;
		}

		// Avoid locomotion interference.
		this.ignore( false );
	}

	/**
	 * Enable / disable overlapping locomotion mechanics while dashing.
	 *
	 * @param {Boolean} enable True to restore, false to suspend.
	 */
	ignore = (
		enable = true
	) => {

		// Get mechanics.
		const m = this.tile?.mechanics;

		// Skip if no mechanics.
		if ( ! m ) {
			return;
		}

		// Temporarily suppress.
		if ( m.jump )     m.jump.listening     = enable;
		if ( m.walk )     m.walk.listening     = enable;
		if ( m.fall )     m.fall.listening     = enable;
		if ( m.walljump ) m.walljump.listening = enable;
		if ( m.coyote )   m.coyote.listening   = enable;
		if ( m.orient )   m.orient.listening   = enable;
	}
}
