import Time from './time.js';

/**
 * Priority-ordered synchronous event hooks.
 *
 * Named hooks contain callbacks grouped by numeric priority. Lower priorities
 * run first. Callbacks can be temporarily suspended by elapsed milliseconds or
 * processed frames without losing their original name and priority.
 */
export default class Hooks {

	/**
	 * Default maximum callback execution-history length.
	 *
	 * @type {Object}
	 */
	static defaults = {
		history: 1000,
	}

	/**
	 * Name of the hook currently executing, or an empty string while idle.
	 *
	 * @type {String}
	 */
	#current;

	/**
	 * Active callbacks grouped by hook name and numeric priority.
	 *
	 * @type {Map<String, Map<Number, Array<Function>>>}
	 */
	#queued;

	/**
	 * Cached ascending priorities for each registered hook name.
	 *
	 * @type {Map<String, Array<Number>>}
	 */
	#ordered;

	/**
	 * Bounded callback execution history stored as a circular array.
	 *
	 * @type {Array<Object>}
	 */
	#done;

	/**
	 * Next execution-history slot to replace after reaching capacity.
	 *
	 * @type {Number}
	 */
	#doneIndex;

	/**
	 * Callbacks awaiting automatic or manual resumption.
	 *
	 * @type {Array<Object>}
	 */
	#suspended;

	/**
	 * Construct an empty hook registry.
	 *
	 * @returns {Hooks} A reset hook registry.
	 */
	constructor() {
		return this.reset();
	}

	/**
	 * Set the registry to its initial empty state.
	 *
	 * @returns {Hooks} this, reset for compatibility with other services.
	 */
	set = () => this.reset();

	/**
	 * Replace all callback collections and clear current execution state.
	 *
	 * Registered, suspended, ordered, and historical callbacks are discarded.
	 *
	 * @returns {Hooks} this, with all queued and historical state cleared.
	 */
	reset = () => {
		this.#current   = '';
		this.#queued    = new Map();
		this.#ordered   = new Map();
		this.#done      = [];
		this.#doneIndex = 0;
		this.#suspended = [];

		return this;
	}

	/**
	 * Register a callback at a numeric priority.
	 *
	 * @param {String} name Hook name.
	 * @param {Function} callback Callback to register.
	 * @param {Number} priority Execution priority; lower values run first.
	 * @returns {Number|Boolean} One-based position, or false for invalid input.
	 */
	add = (
		name     = '',
		callback = null,
		priority = 10
	) => {
		if ( ! name || typeof callback !== 'function' ) {
			return false;
		}

		if ( ! this.#queued.has( name ) ) {
			this.#queued.set( name, new Map() );
		}

		const priorities = this.#queued.get( name );

		if ( ! priorities.has( priority ) ) {
			priorities.set( priority, [] );
			this.#ordered.delete( name );
		}

		const callbacks = priorities.get( priority );
		const existing = callbacks.indexOf( callback );

		if ( existing >= 0 ) {
			return existing + 1;
		}

		return callbacks.push( callback );
	}

	/**
	 * Remove one exact callback registration.
	 *
	 * @param {String} name Hook name.
	 * @param {Function} callback Callback to remove.
	 * @param {Number} priority Registered priority.
	 * @returns {Boolean} Whether the exact callback was removed.
	 */
	remove = (
		name     = '',
		callback = null,
		priority = 10
	) => {
		const callbacks = this.#callbacks( name, priority );

		if ( ! callbacks || typeof callback !== 'function' ) {
			return false;
		}

		const index = callbacks.indexOf( callback );

		if ( index < 0 ) {
			return false;
		}

		callbacks.splice( index, 1 );
		this.#prune( name, priority );
		this.#ordered.delete( name );

		return true;
	}

	/**
	 * Remove every callback registered to one hook name.
	 *
	 * @param {String} name Hook name.
	 * @returns {Boolean} Whether a named hook queue existed and was cleared.
	 */
	clear = ( name = '' ) => {
		if ( ! name ) {
			return false;
		}

		this.#ordered.delete( name );

		return this.#queued.delete( name );
	}

	/**
	 * Return the name of the hook currently executing.
	 *
	 * @returns {String} The current hook name, or an empty string while idle.
	 */
	current = () => this.#current;

	/**
	 * Return callback execution records in chronological order.
	 *
	 * @returns {Array} Copies of the bounded callback execution records.
	 */
	done = () => this.#doneIndex
		? [
			...this.#done.slice( this.#doneIndex ),
			...this.#done.slice( 0, this.#doneIndex ),
		]
		: [ ...this.#done ];

	/**
	 * Return callbacks waiting for manual, frame, or time-based resumption.
	 *
	 * @returns {Array} A shallow copy of the suspended callback records.
	 */
	suspended = () => [ ...this.#suspended ];

	/**
	 * Return the names that currently contain registered callbacks.
	 *
	 * @returns {Array<String>} Hook names in registration order.
	 */
	queued = () => [ ...this.#queued.keys() ];

	/**
	 * Run a named hook synchronously in ascending priority order.
	 *
	 * Every callback receives the original arguments. The return value is the
	 * final callback result, or the first argument when no callback runs.
	 *
	 * @param {String} name Hook name.
	 * @param {...*} args Arguments forwarded to every callback.
	 * @returns {*} Final callback result or initial value.
	 */
	do = (
		name = '',
		...args
	) => {
		let retval = args.length ? args[ 0 ] : false;
		const priorities = this.#queued.get( name );

		this.#current = name;

		try {
			if ( priorities ) {
				if ( ! this.#ordered.has( name ) ) {
					this.#ordered.set(
						name,
						[ ...priorities.keys() ].sort( ( a, b ) => a - b )
					);
				}

				const ordered = this.#ordered.get( name );

				for ( const priority of ordered ) {
					for ( const callback of [ ...priorities.get( priority ) ] ) {
						retval = callback( ...args );
						this.#record( {
							name,
							callback,
							priority,
						} );
					}
				}
			}
		} finally {
			this.#current = '';
		}

		return retval;
	}

	/**
	 * Temporarily remove a callback until either delay condition is satisfied.
	 *
	 * @param {String} name Hook name.
	 * @param {Function} callback Exact registered callback.
	 * @param {Number} priority Registered priority.
	 * @param {Object} options Millisecond (`ms`) and/or frame delay.
	 * @returns {Boolean} Whether the callback was suspended.
	 */
	suspend = (
		name     = '',
		callback = null,
		priority = 10,
		options  = {}
	) => {
		const milliseconds = Math.max( 0, Number( options.ms ) || 0 );
		const frames = Math.max( 0, Math.floor( Number( options.frames ) || 0 ) );

		if (
			! this.exists( name, callback, priority )
			||
			( milliseconds === 0 && frames === 0 )
		) {
			return false;
		}

		this.remove( name, callback, priority );
		this.#suspended.push( {
			name,
			callback,
			priority,
			expiresAt: milliseconds ? Time.now + milliseconds : 0,
			framesLeft: frames,
			usesFrames: frames > 0,
		} );

		return true;
	}

	/**
	 * Restore one suspended callback immediately.
	 *
	 * @param {String} name Hook name.
	 * @param {Function} callback Exact suspended callback.
	 * @param {Number} priority Registered priority.
	 * @returns {Boolean} Whether the exact suspended callback was restored.
	 */
	resume = (
		name     = '',
		callback = null,
		priority = 10
	) => {
		const index = this.#suspended.findIndex( entry => (
			entry.name === name
			&&
			entry.callback === callback
			&&
			entry.priority === priority
		) );

		if ( index < 0 ) {
			return false;
		}

		const [ entry ] = this.#suspended.splice( index, 1 );
		this.add( entry.name, entry.callback, entry.priority );

		return true;
	}

	/**
	 * Restore suspended callbacks whose time or frame delay has elapsed.
	 *
	 * @param {Boolean} advanceFrames Whether this processing pass counts a frame.
	 * @returns {void}
	 */
	process = ( advanceFrames = false ) => {
		const remaining = [];

		for ( const entry of this.#suspended ) {
			if ( advanceFrames && entry.framesLeft > 0 ) {
				entry.framesLeft--;
			}

			const timeReady = entry.expiresAt > 0 && Time.now >= entry.expiresAt;
			const frameReady = entry.usesFrames && entry.framesLeft === 0;

			if ( timeReady || frameReady ) {
				this.add( entry.name, entry.callback, entry.priority );
			} else {
				remaining.push( entry );
			}
		}

		this.#suspended = remaining;
	}

	/**
	 * @param {String} name Hook name.
	 * @returns {Boolean} Whether the named hook is currently executing.
	 */
	doing = ( name = '' ) => name === this.#current;

	/**
	 * Check the bounded execution history.
	 *
	 * Omitting `callback` matches any execution of the named hook.
	 *
	 * @param {String} name Hook name.
	 * @param {Function|null} callback Optional exact callback.
	 * @param {Number} priority Registered priority when callback is supplied.
	 * @returns {Boolean} Whether a matching callback execution was recorded.
	 */
	did = (
		name     = '',
		callback = null,
		priority = 10
	) => this.#done.some( entry => (
		entry.name === name
		&&
		( typeof callback !== 'function' || entry.callback === callback )
		&&
		( typeof callback !== 'function' || entry.priority === priority )
	) );

	/**
	 * Check the active callback registry.
	 *
	 * @param {String} name Hook name.
	 * @param {Function|null} callback Optional exact callback.
	 * @param {Number} priority Registered priority.
	 * @returns {Boolean} Whether a matching callback is currently registered.
	 */
	exists = (
		name     = '',
		callback = null,
		priority = 10
	) => {
		const callbacks = this.#callbacks( name, priority );

		if ( ! callbacks ) {
			return false;
		}

		return typeof callback === 'function'
			? callbacks.includes( callback )
			: callbacks.length > 0;
	}

	/**
	 * Get the callback list at one name and priority.
	 *
	 * @param {String} name Hook name.
	 * @param {Number} priority Registered priority.
	 * @returns {Array<Function>|undefined} Internal callback list.
	 */
	#callbacks = (
		name,
		priority
	) => this.#queued.get( name )?.get( priority );

	/**
	 * Record one callback execution without shifting the bounded history.
	 *
	 * Once the history limit is reached, the oldest slot is replaced and the
	 * circular index advances. Ordering is restored only when done() is read.
	 *
	 * @param {Object} entry Callback execution record.
	 * @returns {void}
	 */
	#record = ( entry ) => {
		const limit = this.#historyLimit();

		// A disabled or invalid limit retains no execution history.
		if ( ! limit ) {
			this.#done = [];
			this.#doneIndex = 0;

			return;
		}

		// Restore chronology when a changed limit no longer fits the ring.
		if (
			this.#done.length > limit
			||
			( this.#doneIndex && this.#done.length < limit )
		) {
			this.#done = this.done().slice( -limit );
			this.#doneIndex = 0;
		}

		if ( this.#done.length < limit ) {
			this.#done.push( entry );

			return;
		}

		this.#done[ this.#doneIndex ] = entry;
		this.#doneIndex = ( this.#doneIndex + 1 ) % limit;
	}

	/**
	 * Normalize the configured execution-history capacity.
	 *
	 * Fractional values are truncated to whole records. Zero, negative,
	 * nonnumeric, and non-finite values disable history retention.
	 *
	 * @returns {Number} Nonnegative integer record capacity.
	 */
	#historyLimit = () => {
		const limit = Number( Hooks.defaults.history );

		return Number.isFinite( limit )
			? Math.max( 0, Math.floor( limit ) )
			: 0;
	}

	/**
	 * Remove empty priority and hook containers after a callback is removed.
	 *
	 * @param {String} name Hook name.
	 * @param {Number} priority Registered priority.
	 * @returns {void}
	 */
	#prune = (
		name,
		priority
	) => {
		const priorities = this.#queued.get( name );

		if ( ! priorities ) {
			return;
		}

		if ( priorities.get( priority )?.length === 0 ) {
			priorities.delete( priority );
		}

		if ( priorities.size === 0 ) {
			this.#queued.delete( name );
		}
	}
}
