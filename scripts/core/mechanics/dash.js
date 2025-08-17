import Game from '../game.js';
import Settings from '../../custom/settings.js';
import Time from '../utilities/time.js';

/**
 * Dash mechanic: double-tap directional dash (Celeste-inspired).
 */
export default class Dash {

	constructor( tile = null ) {
		this.set( tile );
	}

	set = ( tile = null ) => {
		this.reset();
		this.tile = tile;
	}

	reset = () => {
		this.tile       = null;
		this.lastDir    = null;
		this.lastTime   = 0;
        this.listening  = true;
		this.active     = false;
		this.endAt      = 0;
		this.coolUntil  = 0;
		this.uses       = 0;
	}

	listen = () => {
        if ( ! this.listening ) return;
		if ( ! this.tile ) return;

		const cfg = Settings.player.dash;
		const now = Time.now;
		const grounded = Boolean( this.tile?.physics?.contact?.bottom );

		// Reset dash uses on ground.
		if ( grounded ) {
			this.uses = 0;
		}

		// If currently dashing, maintain velocity until end.
		if ( this.active ) {
			if ( now >= this.endAt ) {
				this.active = false;
			} else {
				return;
			}
		}

		// Abort if on cooldown or out of uses.
		if ( now < this.coolUntil || this.uses >= cfg.limit ) return;

		// Dash no longer scans raw inputs; it instead waits for combo hooks.
	}

	/**
	 * Register hook to react to combo triggers.
	 */
	hooks = () => {
		Game.Hooks.add( 'Combo.trigger', this.combo );
	}

	/**
	 * Handle combo triggers.
	 */
	combo = (
        name = '',
        data = {}
    ) => {
		if ( ! this.listening ) return;
		const cfg = Settings.player.dash;
		const now = Time.now;

		if ( now < this.coolUntil || this.uses >= cfg.limit ) return;

		let dir = '';
		if ( name === 'dashLeft' ) dir = 'left';
		else if ( name === 'dashRight' ) dir = 'right';
		else if ( name === 'dashUp' ) dir = 'up';
		else if ( name === 'dashDown' ) dir = 'down';
		else return; // not a dash combo

		// Trigger dash.
		if (
            ! this.tile?.physics?.contact?.bottom
            &&
            ! cfg.air
            &&
            ( dir === 'up' || dir === 'down' )
        ) {
            return;
        }

		this.do( dir, now, cfg );
	}

	do = ( dir, now, cfg ) => {
		const v = this.tile?.physics?.velocity;

		if ( ! v ) {
            return;
        }

		this.active    = true;
		this.endAt     = now + cfg.duration;
		this.coolUntil = now + cfg.cooldown;
		this.uses++;

        // Stop all movement.
        v.y = 0;
        v.x = 0;

		// Base zero friction style impulse: overwrite components.
		if ( dir === 'left' ) {
			v.x = -cfg.xpower;

		} else if ( dir === 'right' ) {
			v.x = cfg.xpower;

        // Upward.
		} else if ( dir === 'up' ) {
			v.y = -cfg.ypower;

        // Downward.
		} else if ( dir === 'down' ) {
			v.y = cfg.ypower;
		}

        // Disable movement mechanics during dash.
		this.tile.mechanics.fall.listening = false;
		this.tile.mechanics.jump.listening = false;
        this.tile.mechanics.walk.listening = false;

		// Schedule re-enable check each frame via hook only once.
		if ( ! this._resumeHookAdded ) {
			Game.Hooks.add( 'Frame.tick', this.resume, 13 );
			this._resumeHookAdded = true;
		}
	}

	/**
	 * Resume walking after dash ends; remove self once done.
	 */
	resume = () => {

        // Re-enable movement mechanics.
		if ( ! this.active ) {
            this.tile.mechanics.fall.listening = true;
            this.tile.mechanics.jump.listening = true;
            this.tile.mechanics.walk.listening = true;
			this._resumeHookAdded = false;
			return;
		}

		// Check if time passed.
		if (
            this.active
            &&
            ( Time.now >= this.endAt )
         ) {
			this.active = false;
		}
	}
}
