import Settings from '../../../content/settings.js';
import Game from '../../game.js';

/**
 * The Nudge mechanic.
 *
 * Provides an immediate small horizontal impulse on the first frame a
 * directional input is pressed (an input "edge"). This gives snappy response
 * before the slower acceleration curve (handled by Ramp) ramps up.
 *
 * Responsibilities:
 * - Detect left / right edge via History.edge().
 * - Apply +/- base speed (from Settings.player.move.base) exactly once per press.
 * - Defer sustained speed evolution to later movement mechanics.
 */
export default class Nudge {

	/**
	 * Default nudge settings.
	 *
	 * @type {Object}
	 */
	static defaults = {
		base: 1,
	}

	/**
	 * Construct the Nudge mechanic.
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
		this.settings  = Settings.player?.move ?? Nudge.defaults;
		this.listening = true;

		return this;
	}


	/**
	 * Listen for nudge input.
	 */
	listen = () => {

		// Skip if disabled or unbound.
		if ( ! this.listening || ! this.tile ) {
			return;
		}

		// Velocity reference.
		const v = this.tile.physics?.velocity;
		if ( ! v ) {
			return;
		}

		// Apply exactly on edge frame.
		if ( Game.History.edge( 'left' ) ) {
			v.x = -this.settings.base;
		} else if ( Game.History.edge( 'right' ) ) {
			v.x = this.settings.base;
		}
	}
}
