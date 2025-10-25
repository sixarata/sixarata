import Settings from '../../../content/settings.js';
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
	 * Default sprint settings.
	 *
	 * @type {Object}
	 */
	static defaults = {
		run: 20,
		runHold: 300,
	}

	/**
	 * Construct the Sprint mechanic.
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

		// Return.
		return this;
	}

	/**
	 * Reset the mechanic.
	 */
	reset = () => {
		this.tile      = null;
		this.settings  = Settings.player?.move ?? Sprint.defaults;
		this.listening = true;
	}


	/**
	 * Listen for sprint activation.
	 */
	listen = () => {

		// Skip if disabled or unbound.
		if ( ! this.listening || ! this.tile ) {
			return;
		}

		const v = this.tile.physics?.velocity;
		if ( ! v ) {
			return;
		}

		const l = Game.History.hold( 'left' );
		const r = Game.History.hold( 'right' );

		if ( l?.down && ! r?.down && l.duration >= this.settings.runHold ) {
			v.x = -this.settings.run;
		} else if ( r?.down && ! l?.down && r.duration >= this.settings.runHold ) {
			v.x = this.settings.run;
		}
	}
}
