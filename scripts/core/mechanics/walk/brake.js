import Settings from '../../../custom/settings.js';
import Game from '../../game.js';

/**
 * The BrakeWalk mechanic.
 *
 * Applies a braking multiplier when the opposite direction is pressed on an
 * input edge while moving horizontally, creating a responsive deceleration.
 */
export default class Brake {

	/**
	 * Construct the Brake mechanic.
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
	 * Listen for braking edges.
	 */
	listen = () => {
		if ( ! this.listening || ! this.tile ) {
			return;
		}

		const v = this.tile.physics?.velocity;
		if ( ! v ) {
			return;
		}

		const cfg   = Settings.player.move || {};
		const brake = ( cfg.brake ?? 0.4 );

		// Opposite-direction edges get immediate braking.
		if ( Game.History.edge( 'left' ) && v.x > 0 ) {
			v.x *= brake;
		}
		if ( Game.History.edge( 'right' ) && v.x < 0 ) {
			v.x *= brake;
		}
	}
}
