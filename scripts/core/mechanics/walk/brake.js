import Settings from '../../../content/settings.js';
import Game from '../../game.js';

/**
 * The BrakeWalk mechanic.
 *
 * Applies a braking multiplier when the opposite direction is pressed on an
 * input edge while moving horizontally, creating a responsive deceleration.
 */
export default class Brake {

	/**
	 * Default brake settings.
	 *
	 * @type {Object}
	 */
	static defaults = {
		multiplier: 0.4,
	}

	/**
	 * Construct the Brake mechanic.
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
	set = (
		tile = null
	) => {
		this.reset();
		this.tile = tile;

		return this;
	}

	/**
	 * Reset the mechanic.
	 */
	reset = () => {
		this.tile      = null;
		this.settings  = Settings.player?.move ?? Brake.defaults;
		this.listening = true;

		return this;
	}

	/**
	 * Listen for braking edges.
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

		// Opposite-direction edges get immediate braking.
		if ( Game.History.edge( 'left' ) && v.x > 0 ) {
			v.x *= this.settings.multiplier;
		}

		if ( Game.History.edge( 'right' ) && v.x < 0 ) {
			v.x *= this.settings.multiplier;
		}
	}
}
