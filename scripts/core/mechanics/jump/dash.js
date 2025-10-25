import Game from '../../game.js';
import Settings from '../../../content/settings.js';
import Timer from '../../utilities/timer.js';

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
	 * Default dash settings.
	 *
	 * @type {Object}
	 */
	static defaults = {
		limit: 3,
		times: {
			duration: 80,
			cooldown: 250,
			hover: 250,
		},
		can: {
			air: true,
			ground: false,
			wall: true,
		},
		power: {
			x: 75,
			y: 75,
		},
		reset: {
			ground: true,
			wall: true,
		},
	}

	/**
	 * Construct the Dash mechanic.
	 *
	 * @param {Tile|null} tile Optional tile to bind immediately.
	 */
	constructor(
		tile = null
	) {
		return this.set( tile );
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

		return this;
	}

	/**
	 * Reset internal state to defaults.
	 */
	reset = () => {

		// Attributes.
		this.tile      = null;
		this.settings  = Settings.player?.dash ?? Dash.defaults;
		this.listening = true;
		this.uses      = 0;

		// Timers.
		this.impulse   = new Timer();
		this.hover     = new Timer();
		this.cool      = new Timer();

		// Return.
		return this;
	}

	/**
	 * Per‑frame housekeeping.
	 * - expires active dash
	 * - resets use counter
	 *
	 * Should be invoked once per frame, before velocity integration.
	 */
	listen = () => {

		// Skip if disabled or unbound.
		if ( ! this.listening || ! this.tile ) {
			return;
		}

		// Maybe reset uses.
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
				this.tile.mechanics.wall.grab.doing()
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

		// Skip if disabled or unbound.
		if ( ! this.listening || ! this.tile ) {
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

		// Skip if disabled or unbound.
		if ( ! this.listening || ! this.tile ) {
			return;
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
			! this.settings.can.air
			&&
			! this.tile.mechanics.jump.grounded()
		) {
			return false;
		}

		// Skip if no ground.
		if (
			! this.settings.can.ground
			&&
			this.tile.mechanics.jump.grounded()
		) {
			return false;
		}

		// Skip if wall grab is not active.
		if (
			! this.settings.can.wall
			&&
			this.tile.mechanics.wall.grab?.doing()
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

		// If invoked manually (not via combo), require edge on the direction.
		if ( dir ) {
			let action = '';

			// Map direction to action.
			if (
				( dir === 'left' )
				||
				( dir === 'right' )
				||
				( dir === 'up' )
				||
				( dir === 'down' )
			) {
				action = dir;
			}

			// Require edge on the action.
			if ( action && ! Game.History.edge( action ) ) {
				return false;
			}
		}

		// Do the dash.
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
		this.impulse.set( this.settings.times.duration );
		this.hover.set( this.settings.times.duration + this.settings.times.hover );
		this.cool.set( this.settings.times.cooldown );

		// Reset motion before impulse.
		v.x = 0;
		v.y = 0;

		// Horizontal.
		if ( dir === 'left' ) {
			v.x = -( this.settings.power.x );
		} else if ( dir === 'right' ) {
			v.x = this.settings.power.x;

		// Vertical.
		} else if ( dir === 'up' ) {
			v.y = -( this.settings.power.y );
		} else if ( dir === 'down' ) {
			v.y = this.settings.power.y;
		}

		// Avoid locomotion interference.
		this.ignore( false );

		// Emit dash particles.
		Game.Hooks.do( 'Player.dash', this.tile, dir );
	}

	/**
	 * Enable / disable overlapping locomotion mechanics while dashing.
	 *
	 * @param {Boolean} enable True to restore, false to suspend.
	 */
	ignore = (
		enable = true
	) => {
		const m = this.tile?.mechanics;
		if ( ! m ) {
			return;
		}

		if ( m.jump )   m.jump.listening   = enable;
		if ( m.fall )   m.fall.listening   = enable;
		if ( m.coyote ) m.coyote.listening = enable;
		if ( m.orient ) m.orient.listening = enable;

		// Enable/disable wall mechanics.
		const wall = this.tile.mechanics?.wall;
		if ( wall ) {
			for ( const key of Object.keys( wall ) ) {
				const s = wall[ key ];

				if ( s && s.listening !== undefined ) {
					s.listening = enable;
				}
			}
		}

		// Enable/disable walk mechanics.
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

	/**
	 * Whether or not the dash is active (impulse or hover).
	 *
	 * @returns {Boolean}
	 */
	active = () => {
		return this.impulse.active() || this.hover.active();
	}
}
