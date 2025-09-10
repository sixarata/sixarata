import Settings from '../../../custom/settings.js';
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
	 * Construct the Nudge mechanic.
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

		// Config.
		const cfg  = Settings.player.move || {};
		const base = ( cfg.base ?? 1 );

		// Apply exactly on edge frame.
		if ( Game.History.edge( 'left' ) ) {
			v.x = -base;
		} else if ( Game.History.edge( 'right' ) ) {
			v.x = base;
		}
	}
}
