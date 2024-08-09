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
	 * Construct the object.
	 */
	constructor() {
		this.set();
	}

	/**
	 * Set the object.
	 */
	set = () => {
		this.reset();
	}

	/**
	 * Reset the Hooks.
	 */
	reset = () => {
		this.#done    = [];
		this.#queued  = [];
		this.#current = '';
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
	 * @returns {Mixed}  The removed callback.
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
	 * @returns {Mixed}  The removed hook name.
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
	 * Get all of the queued hook names.
	 *
	 * @returns {Array} The queued hook names.
	 */
	queued = () => {
		return this.#queued;
	}

	/**
	 * Get all of the completed hook names.
	 *
	 * @returns {Array} The completed hook names.
	 */
	done = () => {
		return this.#done;
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

		// Limit the done array to the last 1 second.
		if ( this.#done.length > 1000 ) {
			this.#done.shift();
		}

		// Return.
		return retval;
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
	 * @param {String}   name
	 * @param {String}   callback
	 * @param {Number}   priority
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
