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

	constructor() {
		this.set();
	}

	set = () => {
		this.reset();
	}

	reset = () => {

        // Action -> { down, beganAt, duration, endedAt }
		this.state   = {};

		// Ordered list of recent events
        this.events  = [];

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

        // Bail if no devices.
		if ( ! Game?.Inputs?.devices ) {
            return;
        }

		const now = Time.now;

		// Collect unique action names across devices.
		const actions = new Set();

		for ( const d of Game.Inputs.devices ) {
			if ( d?.map ) {
				Object.keys( d.map ).forEach(
                    a => actions.add( a )
                );
			}
		}

		// Update each action.
		for ( const action of actions ) {
			const isDown = Game.Inputs.pressed( action );

			let s = this.state[ action ];

            let e = {};

			if ( ! s ) {
				s = this.state[ action ] = {
                    down: false,
                    beganAt: 0,
                    duration: 0,
                    endedAt: 0
                };
			}

			if ( isDown ) {

                // Fresh press.
				if ( ! s.down ) {
					s.down     = true;
					s.beganAt  = now;
					s.duration = 0;
					s.endedAt  = 0;

                    // Create press event.
                    e = {
                        action,
                        type: 'press',
                        time: now
                    };

                // Continue hold; update duration.
				} else {
					s.duration = now - s.beganAt;
				}

            // Release detected.
			} else if ( s.down ) {
				s.down     = false;
				s.duration = now - s.beganAt;
				s.endedAt  = now;

                // Create release event.
                e = {
                    action,
                    type: 'release',
                    time: now,
                    duration: s.duration
                }
			}

            // Push the event.
            if ( e.action ) {
                this.pushEvent( e );
            }
		}
	}

	/**
	 * Internal: push event & trim.
	 */
	pushEvent = ( evt = {} ) => {
		this.events.push( evt );

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
	hold = ( action = '' ) => {
		return this.state[ action ];
	}

	/**
	 * Get recent events (optionally filtered).
     *
	 * @param {Object} options { action, type, window }
	 */
	recent = ( options = {} ) => {
		const {
            action = null,
            type   = null,
            window = 0
        } = options;

		const now = Time.now;

		return this.events.filter( e => (
			( ! action || e.action === action ) &&
			( ! type || e.type === type ) &&
			( ! window || ( now - e.time ) <= window )
		) );
	}

	/**
	 * Count presses for an action within a window (ms).
	 */
	pressCount = (
        action = '',
        window = 0
    ) => {
		return this.recent( {
            action,
            type: 'press',
            window
        } ).length;
	}
}
