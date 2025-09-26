import Time from './time.js';

/**
 * The Hooks object.
 *
 * This object is responsible for adding, removing, and doing the hooks that have
 * been queued up by other parts of the application.
 */
export default class Hooks {

	/**
	 * Private name of the current hook.
	 *
	 * @private {String} current
	 */
	#current = '';

	/**
	 * Private array of queued hooks.
	 *
	 * @private {Array} queued
	 */
	#queued = [];

	/**
	 * Private array of completed hooks.
	 *
	 * @private {Array} done
	 */
	#done = [];

	/**
	 * Private array of suspended hooks.
	 *
	 * @private {Array} suspended
	 */
	#suspended = [];

	/**
	 * Construct the object.
	 */
	constructor() {
		return this.set();
	}

	/**
	 * Set the object.
	 */
	set = () => {
		return this.reset();
	}

	/**
	 * Reset the Hooks.
	 */
	reset = () => {

		// Reset attributes.
		this.#current   = '';
		this.#done      = [];
		this.#suspended = [];
		this.#queued    = [];

		// Return.
		return this;
	}

	/**
	 * Add a callback hook.
	 *
	 * @param   {String} name
	 * @param   {String} callback
	 * @param   {Number} priority
	 * @returns {Mixed}  The index of the callback.
	 */
	add = (
		name     = '',
		callback = '',
		priority = 10
	) => {

		// Skip if empty.
		if ( ! name || ! callback ) {
			return false;
		}

		// Setup array if empty.
		if ( ! this.#queued[ name ] ) {
			this.#queued[ name ] = [];
		}

		// Setup array if empty.
		if ( ! this.#queued[ name ][ priority ] ) {
			this.#queued[ name ][ priority ] = [];
		}

		// Look for existing callback.
		let index = this.#queued[ name ][ priority ].indexOf( callback );

		// Avoid multiples.
		if ( -1 === index ) {
			index = this.#queued[ name ][ priority ].push( callback );
		}

		// Return the index.
		return index;
	}

	/**
	 * Remove a callback from the hook queue.
	 *
	 * @param   {String} name
	 * @param   {String} callback
	 * @param   {Number} priority
	 * @returns {Mixed}  True if removed, false if not found.
	 */
	remove = (
		name     = '',
		callback = '',
		priority = 10
	) => {

		// Skip if does not exist.
		if ( ! this.exists( name, callback, priority ) ) {
			return false;
		}

		// Get the callback position.
		let index = this.#queued[ name ][ priority ].indexOf( callback );

		// Remove the callback from the array.
		return this.#queued[ name ][ priority ].splice( index, 1 );
	}

	/**
	 * Completely clear a hook of all callbacks at all priorities.
	 *
	 * @param   {String} name
	 * @returns {Mixed}  True if cleared, false if not found.
	 */
	clear = (
		name = ''
	) => {

		// Skip if empty.
		if ( ! name || ! this.#queued[ name ] ) {
			return false;
		}

		// Remove hook name.
		return this.#queued[ name ].remove;
	}

	/**
	 * Get the current hook name.
	 *
	 * @returns {String} The current hook name.
	 */
	current = () => {
		return this.#current;
	}

	/**
	 * Get a shallow copy of completed hook names.
	 *
	 * @returns {Array} The completed hook names.
	 */
	done = () => {
		return [ ...this.#done ];
	}

	/**
	 * Get a shallow copy of suspended entries (for debugging / introspection).
	 *
	 * @returns {Array} The suspended entries.
	 */
	suspended = () => {
		return [ ...this.#suspended ];
	}

	/**
	 * Get a shallow copy of queued hook names.
	 *
	 * @returns {Array} The queued hook names.
	 */
	queued = () => {
		return [ ...this.#queued ];
	}

	/**
	 * Run all of the callbacks of a hook name.
	 *
	 * @param   {String} name
	 * @param   {...any} args
	 * @returns {Mixed}  The return value of the last callback.
	 */
	do = (
		name = '',
		...args
	) => {

		// Default return value.
		let retval = args[ 0 ]
			? args[ 0 ]
			: false;

		// Doing...
		this.#current = name;

		// Do it.
		if ( name && this.#queued[ name ] ) {

			// Loop through priorities.
			for ( let priority in this.#queued[ name ] ) {

				// Loop through callbacks.
				for ( let callback in this.#queued[ name ][ priority ] ) {

					// Get the return value.
					retval = this.#queued[ name ][ priority ][ callback ]( ...args );
				}
			}
		}

		// Done.
		this.#done.push( name );
		this.#current = '';

		// Limit the done array to the last 1000.
		if ( this.#done.length > 1000 ) {
			this.#done.shift();
		}

		// Return.
		return retval;
	}

	/**
	 * Suspend a hook, and schedule automatic re‑addition.
	 *
	 * Supply:
	 * - millisecond duration (ms)
	 * - frame count (frames)
	 *
	 * If both are used, the first condition that is met triggers the restore.
	 *
	 * @param {String}    name     Hook name.
	 * @param {Function}  callback Callback reference originally added.
	 * @param {Number}    priority Priority level (defaults to 10 like add/remove).
	 * @param {Object}    options  { ms: Number, frames: Number }
	 * @returns {Boolean} True if suspended, false if not found or invalid.
	 */
	suspend = (
		name     = '',
		callback = '',
		priority = 10,
		options  = {}
	) => {

		// Must exist to suspend.
		if ( ! this.exists( name, callback, priority ) ) {
			return false;
		}

		// Get the suspension options.
		const ms     = options.ms     ?? 0;
		const frames = options.frames ?? 0;
		const now    = Time.now;

		// Skip if no suspension options.
		if ( ! ms && ! frames ) {
			return false;
		}

		// Remove it from active queue.
		this.remove( name, callback, priority );

		// Record suspension.
		this.#suspended.push( {
			name,
			callback,
			priority,
			expires: ( ms > 0 ) ? ( now + ms ) : 0,
			frames: ( frames > 0 ) ? frames : 0,
		} );

		return true;
	}

	/**
	 * Manually resume a suspended hook immediately.
	 *
	 * @param {String}    name
	 * @param {Function}  callback
	 * @param {Number}    priority
	 * @returns {Boolean} True if resumed, false if not found.
	 */
	resume = (
		name     = '',
		callback = '',
		priority = 10
	) => {
		let found = false;

		this.#suspended = this.#suspended.filter( entry => {
			if (
				! found
				&&
				entry.name === name
				&&
				entry.callback === callback
				&&
				entry.priority === priority
			) {
				this.add( name, callback, priority );
				found = true;

				// Remove from suspended
				return false;
			}

			// Keep others
			return true;
		} );

		return found;
	}

	/**
	 * Process suspended hooks.
	 *
	 * Re‑adds hooks with elapsed timers / frame-counts.
	 *
	 * @param {Boolean} advanceFrames Whether to decrement frame counters this pass.
	 * @returns {Void}
	 */
	process = (
		advanceFrames = false
	) => {

		// Skip if no suspended hooks.
		if ( ! this.#suspended.length ) {
			return;
		}

		const now = Time.now;
		const remaining = [];

		for ( const entry of this.#suspended ) {

			// Decrement frame counter only when appropriate.
			if ( advanceFrames && entry.framesLeft > 0 ) {
				entry.framesLeft--;
			}

			const timeReady  = entry.expires && entry.expires > 0 && now >= entry.expires;
			const frameReady = entry.frames === 0 && ( entry.expires === 0 || ! entry.expires );
			const dualReady  = ( entry.frames === 0 && entry.expires > 0 && now >= entry.expires );

			if ( timeReady || frameReady || dualReady ) {
				this.add( entry.name, entry.callback, entry.priority );

			} else {
				remaining.push( entry );
			}
		}

		this.#suspended = remaining;
	}

	/**
	 * Return whether a hook name is being done.
	 *
	 * @param   {String}  name
	 * @returns {Boolean} True if hook is currently being done.
	 */
	doing = (
		name = ''
	) => {
		return ( name === this.#current );
	}

	/**
	 * Return whether a hook callback has been done.
	 *
	 * @param   {String}  name
	 * @param   {String}  callback
	 * @param   {Number}  priority
	 * @returns {Boolean} True if hook callback has been done.
	 */
	did = (
		name     = '',
		callback = '',
		priority = 10
	) => {

		if ( name && callback ) {
			if ( this.#done[ name ] ) {
				if ( this.#done[ name ][ priority ] ) {
					return callback.length
						? ( -1 !== this.#done[ name ][ priority ].indexOf( callback ) )
						: true;
				}
			}
		}

		return false;
	}

	/**
	 * Return whether a hook callback has been queued.
	 *
	 * @param {String}    name
	 * @param {String}    callback
	 * @param {Number}    priority
	 * @returns {Boolean} True if hook callback has been queued.
	 */
	exists = (
		name     = '',
		callback = '',
		priority = 10
	) => {

		if ( name && callback ) {
			if ( this.#queued[ name ] ) {
				if ( this.#queued[ name ][ priority ] ) {
					return callback.length
						? ( -1 !== this.#queued[ name ][ priority ].indexOf( callback ) )
						: true;
				}
			}
		}

		return false;
	}
}
