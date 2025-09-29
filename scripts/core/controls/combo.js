import Game from '../game.js';
import Settings from '../../custom/settings.js';
import Time from '../utilities/time.js';

/**
 * Combo manager.
 *
 * Watches the Controls History for sequences of action press events matching
 * configured combos (in Settings.combos). When a combo is detected within its
 * window, fires a hook: `Combo.trigger` with ( name, data ).
 */
export default class Combos {

	/**
	 * Default combo manager settings.
	 *
	 * @type {Object}
	 */
	static defaults = {
		cooldown: 30,
	}

	/**
	 * Construct the combo manager.
	 *
	 * @returns {Combos} The constructed Combos instance.
	 */
	constructor() {
		return this.set();
	}

	/**
	 * Set up the combo manager.
	 *
	 * @returns {Combos} this
	 */
	set = () => {
		return this.reset();
	}

	/**
	 * Reset the combo manager.
	 *
	 * @returns {Combos} this
	 */
	reset = () => {

		// Cooldown.
		this.settings = Settings.combos ?? Combos.defaults;

		// Combos.
		this.combos = Settings.player?.combos || {};

		// No last.
		this.last = {};

		// Return.
		return this;
	}

	/**
	 * Register hooks.
	 */
	hooks = () => {
		Game.Hooks.add( 'Frame.tick', this.tick, 12 );
	}

	/**
	 * Tick through time.
	 *
	 * @returns {Void}
	 */
	tick = () => {

		// Get history events.
		const events = Game.History?.events || [];

		// Skip if no events.
		if ( ! events.length ) {
			return;
		}

		// Check each combo.
		for ( const [ name, cfg ] of Object.entries( this.combos ) ) {
			const { sequence = [], window = 0 } = cfg || {};

			// Skip if no sequence.
			if ( sequence.length === 0 ) {
				continue;
			}

			// Check for match.
			if ( this.matched( sequence, window ) ) {
				const now = Time.now;

				// Skip if on cooldown.
				if ( ( now - ( this.last[ name ] || 0 ) ) < this.settings.cooldown ) {
					continue;
				}

				// Record last fire time.
				this.last[ name ] = now;

				// Fire the hook.
				Game.Hooks.do( 'Combo.trigger', name, { sequence, window } );
			}
		}
	}

	/**
	 * Determine if the given sequence of actions occurred (press events) in
	 * order within the time window (ms) ending now.
	 *
	 * @param {Array}  sequence Array of action names (strings).
	 * @param {Number} window   Time window in ms (0 = all time).
	 * @return {Boolean}        True if matched.
	 */
	matched = (
		sequence = [],
		window   = 0
	) => {
		const events = Game.History?.events || [];

		// Skip if no events.
		if ( ! events.length ) {
			return false;
		}

		// Filter to presses inside window.
		const candidates = [];
		const startTime  = ( window > 0 )
			? ( Time.now - window )
			: 0;

		// Walk events backwards to find candidates.
		for ( let i = events.length - 1; i >= 0; i-- ) {
			const ev = events[ i ];

			// Stop if before window.
			if ( ev.time < startTime ) {
				break;
			}

			// Skip if not a press.
			if ( ev.type !== 'press' ) {
				continue;
			}

			// Add to candidates.
			candidates.push( ev );
		}

		// Reverse to chronological order.
		candidates.reverse();

		// Walk sequence against candidates using pointer.
		let si = 0;

		// Check each candidate event.
		for ( const ev of candidates ) {

			// Check for match.
			if ( ev.action === sequence[ si ] ) {

				// Advance sequence pointer.
				si++;

				// Check if done.
				if ( si === sequence.length ) {
					return true;
				}
			}
		}

		// Return no match.
		return false;
	}
}
