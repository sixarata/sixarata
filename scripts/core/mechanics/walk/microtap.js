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
	 * Construct the MicroTap mechanic.
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
	 * Listen for micro tap releases.
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
		const tap    = ( cfg.tap   ?? 120 );
		const factor = ( cfg.micro ?? 0.3 );

		const hl = Game.History.hold( 'left' );
		const hr = Game.History.hold( 'right' );

		if ( Game.History.released( 'left' ) && hl && hl.duration < tap && v.x < 0 ) {
			v.x *= factor;
		}

		if ( Game.History.released( 'right' ) && hr && hr.duration < tap && v.x > 0 ) {
			v.x *= factor;
		}
	}
}
