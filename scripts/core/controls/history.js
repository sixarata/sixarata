import Game from '../game.js';
import Time from '../utilities/time.js';

/**
 * Controls - History.
 *
 * Tracks logical action press / release events with timestamps and maintains
 * per‑action hold durations while buttons are held.
 *
 * Intended foundation for higher level mechanics:
 * - double‑tap
 * - combos
 * - charge moves
 * - buffering
 */
export default class History {

	/**
	 * Constructor.
	 */
	constructor() {
		this.set();
	}

	/**
	 * Initialize the history state.
	 */
	set = () => {
		this.reset();
	}

	/**
	 * Reset the history state.
	 */
	reset = () => {

		// Action -> { down, beganAt, duration, endedAt }
		this.state  = {};

		// Ordered list of recent events
		this.events = [];

		// Cap to avoid unbounded growth
		this.maxEvents = 256;
	}

	/**
	 * Register hooks.
	 */
	hooks = () => {

		// after Inputs (default 10)
		Game.Hooks.add( 'Frame.tick', this.tick, 11 );
	}

	/**
	 * Per‑frame update: sample all devices & actions.
	 */
	tick = () => {

		// Skip if no devices.
		if ( ! Game?.Inputs?.devices ) {
			return;
		}

		const now = Time.now;

		// Collect unique action names across devices.
		const actions = this.actions();

		// Update each action.
		for ( const action of actions ) {
			const isDown = Game.Inputs.pressed( action );

			let s = this.state[ action ],
				e = {};

			if ( ! s ) {
				s = this.state[ action ] = {
					down:     false,
					beganAt:  0,
					duration: 0,
					endedAt:  0,
				};
			}

			if ( isDown ) {

				// Fresh press.
				if ( ! s.down ) {
					s.down	   = true;
					s.beganAt  = now;
					s.duration = 0;
					s.endedAt  = 0;

					// Create press event.
					e = {
						action,
						type: 'press',
						time: now,
					};

				// Continue hold; update duration.
				} else {
					s.duration = now - s.beganAt;
				}

			// Release detected.
			} else if ( s.down ) {
				s.down	   = false;
				s.duration = now - s.beganAt;
				s.endedAt  = now;

				// Create release event.
				e = {
					action,
					type:     'release',
					time:     now,
					duration: s.duration,
				}
			}

			// Push the event.
			if ( e.action ) {
				this.pushEvent( e );
			}
		}
	}

	/**
	 * Get all unique action names.
	 *
	 * @returns {Array}
	 */
	actions = () => {
		const actions = new Set();

		for ( const d of Game.Inputs.devices ) {
			if ( d?.map ) {
				Object.keys( d.map ).forEach(
					a => actions.add( a )
				);
			}
		}

		return actions;
	}

	/**
	 * Internal: push event & trim.
	 */
	pushEvent = (
		e = {}
	) => {
		this.events.push( e );

		if ( this.events.length > this.maxEvents ) {
			this.events.splice( 0, this.events.length - this.maxEvents );
		}
	}

	/**
	 * Get current hold info for an action.
	 *
	 * @param {String} action
	 * @returns {Object|undefined}
	 */
	hold = (
		action = ''
	) => {
		return this.state[ action ];
	}

	/**
	 * Get recent events (optionally filtered).
	 *
	 * @param {Object} options { action, type, window }
	 * @returns {Array}
	 */
	recent = (
		options = {}
	) => {

		// Destructure options.
		const {
			action = null,
			type   = null,
			window = 0,
		} = options;

		// Filter events based on options.
		return this.events.filter( e => (
			( ! action || e.action === action ) &&
			( ! type   || e.type   === type   ) &&
			( ! window || ( Time.now - e.time ) <= window )
		) );
	}

	/**
	 * Count presses for an action within a window (ms).
	 *
	 * @param {String} action
	 * @param {String} type
	 * @param {Number} window
	 * @returns {Number}
	 */
	presses = (
		action = '',
		type   = 'press',
		window = 0
	) => {
		return this.recent( {
			action,
			type: type,
			window,
		} ).length;
	}

	/**
	 * Edge detection: true only on the first frame of a fresh action.
	 *
	 * @param {String} action
	 * @returns {Boolean}
	 */
	edge = (
		action = ''
	) => {
		const s = this.state[ action ];

		return !!( s && s.down && s.duration === 0 );
	}

	/**
	 * Held: current action for at least ms (default 0 = any hold).
	 *
	 * @param {String} action
	 * @param {Number} ms Minimum duration (ms)
	 * @returns {Boolean}
	 */
	held = (
		action = '',
		ms     = 0
	) => {
		const s = this.state[ action ];

		if ( ! s || ! s.down ) {
			return false;
		}

		return ( s.duration >= ms );
	}

	/**
	 * Released: true on first frame after release (duration>0 and endedAt just set this tick).
	 *
	 * Simplest practical heuristic: last event for action is a release within this frame delta window.
	 *
	 * @param {String} action
	 * @returns {Boolean}
	 */
	released = (
		action = ''
	) => {

		// Look at most recent event for this action.
		for ( let i = this.events.length - 1; i >= 0; i-- ) {
			const e = this.events[ i ];

			// Skip if not matching action.
			if ( e.action !== action ) {
				continue;
			}

			// Same tick.
			return ( e.type === 'release' )
				&& ( Time.now - e.time ) <= 0;
		}

		// Not released.
		return false;
	}
}
