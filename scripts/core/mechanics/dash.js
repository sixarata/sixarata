import Game from '../game.js';
import Settings from '../../custom/settings.js';
import Time from '../utilities/time.js';

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
		this.tile       = null;
        this.settings   = Settings.player.dash;
        this.listening  = true;

        // Attributes.
		this.dashing    = false;
		this.hovering   = false;
		this.endAt      = 0;
		this.hoverEndAt = 0;
		this.coolUntil  = 0;
		this.uses       = 0;
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

		// Actively dashing.
		if ( this.dashing ) {

            // Still dashing.
			if ( Time.now < this.endAt ) {
				return;
			}

			// Transition out of dash, into hover.
			this.dashing = false;

			const v = this.tile?.physics?.velocity;
			if ( v ) {
				v.x = 0;
				v.y = 0;
			}
		}

		// Hovering.
		if ( this.hoverEndAt > 0 ) {

            // Still hovering.
			if ( Time.now < this.hoverEndAt ) {
				return;
			}

			// Hover finished.
			this.hoverEndAt = 0;

            // Restore mechanics.
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
		if ( this.dashing ) {
			return false;
		}

        // Skip if not cooled down.
		if ( ! this.cooled() ) {
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
     * Check if the dash is cooled down.
     *
     * @returns {Boolean} True if dash is cooled down.
     */
    cooled = () => {
        return ( Time.now > this.coolUntil );
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

        this.do( dir );

		return this.dashing;
	}

	/**
	 * Do the dash.
     *
     * Apply velocity impulse, start timers, and suspend some other mechanics.
	 *
	 * @param {String} dir Direction of dash.
	 */
	do = (
	    dir
	) => {

        // Get velocity.
		const v = this.tile?.physics?.velocity;

        // Skip if no velocity.
		if ( ! v ) {
			return;
		}

		// Activate state.
		this.dashing    = true;
		this.endAt      = ( Time.now + this.settings.duration );
		this.hoverEndAt = ( this.endAt + this.settings.hover  );
		this.coolUntil  = ( Time.now + this.settings.cooldown );
		this.uses++;

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
