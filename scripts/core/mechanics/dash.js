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
		this.lastDir    = null;    // 'left'|'right'|'up'|'down'
		this.lastTime   = 0;       // ms of last tap
		this.active     = false;   // dash currently in progress
		this.endAt      = 0;       // timestamp dash ends
		this.coolUntil  = 0;       // cooldown end timestamp
		this.uses       = 0;       // dashes used since leaving ground
	}

	listen = () => {
		if ( ! this.tile ) return;

		const cfg = Settings.player.dash;
		const now = Time.now;
		const grounded = Boolean( this.tile?.physics?.contact?.bottom );

		// Reset dash uses on ground.
		if ( grounded && cfg.resetOnGround ) {
			this.uses = 0;
		}

		// If currently dashing, maintain velocity until end.
		if ( this.active ) {
			if ( now >= this.endAt ) {
				this.active = false;
			} else {
				return; // lock velocity during dash
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
	combo = ( name = '', data = {} ) => {
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
		if ( ! this.tile?.physics?.contact?.bottom && ! cfg.air && ( dir === 'up' || dir === 'down' ) ) return;
		this.trigger( dir, now, cfg );
	}

	trigger = ( dir, now, cfg ) => {
		const v   = this.tile?.physics?.velocity;
		if ( ! v ) return;
		this.active    = true;
		this.endAt     = now + cfg.duration;
		this.coolUntil = now + cfg.cooldown;
		this.uses++;

		// Base zero friction style impulse: overwrite components.
		if ( dir === 'left' ) {
			v.x = -cfg.power;
			v.y = 0; // optional vertical cancel
		} else if ( dir === 'right' ) {
			v.x = cfg.power;
			v.y = 0;
		} else if ( dir === 'up' ) {
			v.y = -cfg.upPower;
		} else if ( dir === 'down' ) {
			v.y = cfg.upPower; // downward dash
		}

		Game.Hooks.do( 'Dash.trigger', this.tile, dir, cfg );

        console.log( v );
	}
}
