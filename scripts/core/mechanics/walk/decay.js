import Game from '../../game.js';
import Settings from '../../../content/settings.js';
import Time from '../../utilities/time.js';

/**
 * The Decay mechanic.
 *
 * Applies passive frictional decay when no horizontal input is held and
 * snaps very small velocities to zero to prevent drift.
 */
export default class Decay {

	/**
	 * Default decay settings.
	 *
	 * @type {Object}
	 */
	static defaults = {
		base: 30,
	}

	/**
	 * Construct the Decay mechanic.
	 *
	 * @param {Tile|null} tile A Tile with a physics.velocity object.
	 * @returns {Decay} this
	 */
	constructor( tile = null ) {
		return this.set( tile );
	}

	/**
	 * Set the mechanic.
	 *
	 * @param {Tile|null} tile A Tile with a physics.velocity object.
	 * @returns {Decay} this
	 */
	set = ( tile = null ) => {
		this.reset();
		this.tile = tile;
		return this;
	}

	/**
	 * Reset the mechanic.
	 *
	 * @returns {Decay} this
	 */
	reset = () => {
		this.tile      = null;
		this.settings  = Settings.player?.move ?? Decay.defaults;
		this.listening = true;

		return this;
	}


	/**
	 * Listen for idle decay.
	 *
	 * @returns {void}
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

		if ( ! l?.down && ! r?.down ) {
			v.x = Game.Damping.apply(
				v.x,
				Time.seconds()
			);

			if ( Math.abs( v.x ) < this.settings.base ) {
				v.x = 0;
			}
		}
	}
}
