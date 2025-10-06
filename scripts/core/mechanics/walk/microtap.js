import Settings from '../../../custom/settings.js';
import Game from '../../game.js';

/**
 * The MicroTap mechanic.
 *
 * Detects very short directional holds (micro taps) and attenuates velocity
 * on release for finer positional control.
 */
export default class MicroTap {

	/**
	 * Default microtap settings.
	 *
	 * @type {Object}
	 */
	static defaults = {
		duration: 120,
		factor: 0.3,
	}

	/**
	 * Construct the MicroTap mechanic.
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
		this.settings  = Settings.player?.move ?? MicroTap.defaults;
		this.listening = true;

		return this;
	}

	/**
	 * Listen for micro tap releases.
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

		const hl = Game.History.hold( 'left' );
		const hr = Game.History.hold( 'right' );

		if ( Game.History.released( 'left' ) && hl && hl.duration < this.settings.duration && v.x < 0 ) {
			v.x *= this.settings.factor;
		}

		if ( Game.History.released( 'right' ) && hr && hr.duration < this.settings.duration && v.x > 0 ) {
			v.x *= this.settings.factor;
		}
	}
}
