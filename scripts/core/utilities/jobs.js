import Game from '../game.js';

/**
 * The Jobs utility.
 *
 * A lightweight scheduler for deferred, frame-based, or time-based function execution.
 *
 * Use cases:
 * - Temporarily removing a hook and restoring it later (by scheduling a re-add function).
 * - Deferring expensive work until a few frames later.
 * - Simple timeouts without relying directly on setTimeout (keeps everything in the game loop).
 */
export default class Jobs {

	/**
	 * Construct the Jobs utility.
	 */
	constructor() {
		return this.set();
	}

	/**
	 * Set / initialize.
	 */
	set = () => {
		return this.reset();
	}

	/**
	 * Reset internal state.
	 */
	reset = () => {
		this._nextId   = 1;
		this._pending  = [];
		this._indexKey = {};

		return this;
	}

	/**
	 * Register hooks with global Hooks system.
	 */
	hooks = () => {
		Game.Hooks.add( 'Frame.tick', this.tick, 9 );
	}

	/**
	 * Schedule a job.
	 *
	 * @param {Function} fn       The function to execute.
	 * @param {Object}   options  { ms:Number, frames:Number, key:String, args:Array, repeat:Boolean }
	 * @returns {Number|Boolean}  Job id or false on failure.
	 */
	schedule = ( fn = null, options = {} ) => {
		if ( typeof fn !== 'function' ) {
			return false;
		}

		const {
			ms      = 0,
			frames  = 0,
			key     = undefined,
			args    = [],
			repeat  = false,
			intervalMs = 0,
			intervalFrames = 0,
		} = options;

		const id = this._nextId++;
		const nowElapsed = Game.Clock.times.elapsed || 0;

		const job = {
			id,
			fn,
			args,
			key: key || null,
			// scheduling
			expiresAt: ms > 0 ? ( nowElapsed + ms ) : 0,
			framesLeft: frames > 0 ? frames : 0,
			// repetition
			repeat,
			intervalMs: intervalMs || ms,
			intervalFrames: intervalFrames || frames,
			// state
			cancelled: false,
		};

		this._pending.push( job );
		if ( job.key ) {
			if ( ! this._indexKey[ job.key ] ) {
				this._indexKey[ job.key ] = [];
			}
			this._indexKey[ job.key ].push( id );
		}

		return id;
	}

	/**
	 * Cancel a job by id.
	 */
	cancel = ( id = 0 ) => {
		let found = false;
		for ( const job of this._pending ) {
			if ( job.id === id && ! job.cancelled ) {
				job.cancelled = true;
				found = true;
				break;
			}
		}
		return found;
	}

	/**
	 * Cancel all jobs for a given key.
	 */
	cancelKey = ( key = '' ) => {
		if ( ! key || ! this._indexKey[ key ] ) return 0;
		let count = 0;
		for ( const id of this._indexKey[ key ] ) {
			if ( this.cancel( id ) ) count++;
		}
		delete this._indexKey[ key ];
		return count;
	}

	/**
	 * Whether any jobs exist for a key.
	 */
	hasKey = ( key = '' ) => {
		return !! ( key && this._indexKey[ key ] && this._indexKey[ key ].length );
	}

	/**
	 * Process jobs: called each frame via Frame.tick hook.
	 */
	tick = () => {
		const nowElapsed = Game.Clock.times.elapsed || 0;
		const keep = [];

		for ( const job of this._pending ) {
			if ( job.cancelled ) {
				continue;
			}

			// Decrement frame counter first.
			if ( job.framesLeft > 0 ) {
				job.framesLeft--;
			}

			const timeReady  = job.expiresAt > 0 && nowElapsed >= job.expiresAt;
			const frameReady = job.framesLeft === 0 && job.intervalFrames !== 0;
			const ready = (
				( job.expiresAt > 0 && job.framesLeft > 0 )
				? ( timeReady || ( job.framesLeft === 0 ) )
				: ( timeReady || job.framesLeft === 0 )
			);

			if ( ready ) {
				try {
					job.fn( ...job.args );
				} catch ( e ) {
					// Swallow to prevent scheduler break; could add logging.
				}

				if ( job.repeat && ! job.cancelled ) {
					// Re-schedule by resetting timers.
					if ( job.intervalMs > 0 ) {
						job.expiresAt = nowElapsed + job.intervalMs;
					} else {
						job.expiresAt = 0;
					}
					if ( job.intervalFrames > 0 ) {
						job.framesLeft = job.intervalFrames;
					} else {
						job.framesLeft = 0;
					}
					keep.push( job );
				} else {
					// One-shot: drop it; cleanup key index afterwards.
					if ( job.key && this._indexKey[ job.key ] ) {
						this._indexKey[ job.key ] = this._indexKey[ job.key ].filter( id => id !== job.id );
						if ( ! this._indexKey[ job.key ].length ) delete this._indexKey[ job.key ];
					}
				}
			} else {
				keep.push( job );
			}
		}

		this._pending = keep;
	}
}
