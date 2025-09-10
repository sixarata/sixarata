import Settings from '../../../custom/settings.js';
import Game from '../../game.js';

/**
 * The Sprint mechanic.
 *
 * Upgrades horizontal velocity to run speed once an exclusive direction is
 * held long enough (>= runHold).
 *
 * Assumes Ramp handled prior ramping.
 */
export default class Sprint {

	/**
	 * Construct the Sprint mechanic.
	 *
	 * @param {Tile|null} tile A Tile with a physics.velocity object.
	 */
	constructor( tile = null ) {
		this.set( tile );
	}

	/**
	 * Set the mechanic.
	 *
	 * @param {Tile|null} tile A Tile with a physics.velocity object.
	 */
	set = ( tile = null ) => {
		this.tile = tile;
	}

	/**
	 * Reset the mechanic.
	 */
	reset = () => {
		this.tile = null;
	}

	// Whether mechanic is active.
	listening = true;

	/**
	 * Listen for sprint activation.
	 */
	listen = () => {
		if ( ! this.listening || ! this.tile ) {
			return;
		}

		const v = this.tile.physics?.velocity;
		if ( ! v ) {
			return;
		}

		const cfg     = Settings.player.move || {};
		const runSpd  = ( cfg.run     ?? 20 );
		const runHold = ( cfg.runHold ?? 300 );

		const l = Game.History.hold( 'left' );
		const r = Game.History.hold( 'right' );

		if ( l?.down && ! r?.down && l.duration >= runHold ) {
			v.x = -runSpd;
		} else if ( r?.down && ! l?.down && r.duration >= runHold ) {
			v.x = runSpd;
		}
	}
}
