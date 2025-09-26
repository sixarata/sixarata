import Settings from '../../../custom/settings.js';
import Game from '../../game.js';

/**
 * The Walk mechanic.
 *
 * Smoothly grows horizontal velocity from base speed toward max speed while
 * an exclusive direction is held. Growth is linear: duration/accel window.
 * Runs before Sprint so Sprint can overwrite velocity when that tier engages.
 */
export default class Walk {

	/**
	 * Construct the Walk mechanic.
	 *
	 * @param {Tile|null} tile A Tile with a physics.velocity object.
	 */
	constructor( tile = null ) {
		return this.set( tile );
	}

	/**
	 * Set the mechanic.
	 *
	 * @param {Tile|null} tile A Tile with a physics.velocity object.
	 */
	set = ( tile = null ) => {
		this.reset();
		this.tile = tile;

		return this;
	}

	/**
	 * Reset the mechanic.
	 */
	reset = () => {
		this.tile      = null;
		this.listening = true;

		return this;
	}

	/**
	 * Listen for acceleration input.
	 */
	listen = () => {
		if ( ! this.listening || ! this.tile ) {
			return;
		}

		const v = this.tile.physics?.velocity;
		if ( ! v ) {
			return;
		}

		const cfg    = Settings.player.move || {};
		const base   = ( cfg.base   ?? 1 );
		const max    = ( cfg.walk   ?? 16 );
		const accelT = ( cfg.accel  ?? 250 );

		const l = Game.History.hold( 'left' );
		const r = Game.History.hold( 'right' );

		const dur = l?.down && ! r?.down ? l.duration : ( r?.down && ! l?.down ? r.duration : 0 );
		if ( ! dur ) {
			return;
		}

		const ratio  = Math.min( dur, accelT ) / accelT;
		const target = base + ( max - base ) * ratio;

		if ( l?.down && ! r?.down ) {
			v.x = -Math.max( Math.abs( v.x ), target );
		} else if ( r?.down && ! l?.down ) {
			v.x = Math.max( Math.abs( v.x ), target );
		}
	}
}