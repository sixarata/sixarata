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

	constructor() {
		this.set();
	}

	set = () => {
		this.reset();
	}

	reset = () => {
		this.lastFire   = {}; // comboName -> last fired timestamp (debounce)
		this.cooldownMs = 30; // minimal separation to avoid multi-fire same frame
	}

	hooks = () => {
		Game.Hooks.add( 'Frame.tick', this.tick, 12 ); // after History (11)
	}

	tick = () => {
		const combos = Settings.combos || {};
		const events = Game.History?.events || [];
		if ( ! events.length ) return;

		for ( const [ name, cfg ] of Object.entries( combos ) ) {
			const { sequence = [], window = 0 } = cfg || {};
			if ( sequence.length === 0 ) continue;
			if ( this.matched( sequence, window ) ) {
				const now = Time.now;
				if ( ( now - ( this.lastFire[ name ] || 0 ) ) < this.cooldownMs ) continue;
				this.lastFire[ name ] = now;
				Game.Hooks.do( 'Combo.trigger', name, { sequence, window } );
			}
		}
	}

	/**
	 * Determine if the given sequence of actions occurred (press events) in
	 * order within the time window (ms) ending now.
	 */
	matched = ( sequence = [], window = 0 ) => {
		const now = Time.now;
		const events = Game.History?.events || [];
		if ( ! events.length ) return false;

		// Filter to presses inside window.
		const startTime = window > 0 ? ( now - window ) : 0;
		const candidates = [];
		for ( let i = events.length - 1; i >= 0; i-- ) {
			const ev = events[ i ];
			if ( ev.time < startTime ) break; // earlier than window
			if ( ev.type !== 'press' ) continue;
			candidates.push( ev );
		}
		// Reverse to chronological order.
		candidates.reverse();

		// Walk sequence against candidates using pointer.
		let si = 0;
		for ( const ev of candidates ) {
			if ( ev.action === sequence[ si ] ) {
				si++;
				if ( si === sequence.length ) return true;
			}
		}
		return false;
	}
}
