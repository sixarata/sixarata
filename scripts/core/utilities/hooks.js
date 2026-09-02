import Time from './time.js';

/**
 * Priority-ordered synchronous event hooks.
 *
 * Named hooks contain callbacks grouped by numeric priority. Lower priorities
 * run first. Callbacks can be temporarily suspended by elapsed milliseconds or
 * processed frames without losing their original name and priority.
 */
export default class Hooks {

	#current = '';
	#queued = new Map();
	#done = [];
	#suspended = [];

	/** @returns {Hooks} A reset hook registry. */
	constructor() {
		return this.reset();
	}

	/** @returns {Hooks} this, reset for compatibility with other services. */
	set = () => this.reset();

	/** @returns {Hooks} this, with all queued and historical state cleared. */
	reset = () => {
		this.#current = '';
		this.#queued.clear();
		this.#done = [];
		this.#suspended = [];

		return this;
	}

	/**
	 * Register a callback at a numeric priority.
	 *
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
		}

		const callbacks = priorities.get( priority );
		const existing = callbacks.indexOf( callback );

		if ( existing >= 0 ) {
			return existing + 1;
		}

		return callbacks.push( callback );
	}

	/** @returns {Boolean} Whether the exact callback was removed. */
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

		return true;
	}

	/** @returns {Boolean} Whether a named hook queue existed and was cleared. */
	clear = ( name = '' ) => name
		? this.#queued.delete( name )
		: false;

	/** @returns {String} The hook currently executing, or an empty string. */
	current = () => this.#current;

	/** @returns {Array} Copies of callback execution records. */
	done = () => [ ...this.#done ];

	/** @returns {Array} Copies of callbacks waiting to resume. */
	suspended = () => [ ...this.#suspended ];

	/** @returns {Array<String>} Names with registered callbacks. */
	queued = () => [ ...this.#queued.keys() ];

	/**
	 * Run a named hook synchronously in ascending priority order.
	 *
	 * Every callback receives the original arguments. The return value is the
	 * final callback result, or the first argument when no callback runs.
	 *
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
				const ordered = [ ...priorities.keys() ].sort( ( a, b ) => a - b );

				for ( const priority of ordered ) {
					for ( const callback of [ ...priorities.get( priority ) ] ) {
						retval = callback( ...args );
						this.#done.push( {
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

		if ( this.#done.length > 1000 ) {
			this.#done.splice( 0, this.#done.length - 1000 );
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

	/** @returns {Boolean} Whether the exact suspended callback was restored. */
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

	/** @returns {Boolean} Whether the named hook is currently executing. */
	doing = ( name = '' ) => name === this.#current;

	/** @returns {Boolean} Whether a matching callback execution was recorded. */
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

	/** @returns {Boolean} Whether a matching callback is currently registered. */
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

	#callbacks = (
		name,
		priority
	) => this.#queued.get( name )?.get( priority );

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
