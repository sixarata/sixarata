import Settings from '../../custom/settings.js';

/**
 * Abstract Device base class.
 *
 * Provides the interface for all input devices. Subclasses should implement
 * poll(), pressed(), and axes() to provide device-specific input logic.
 */
export default class Device {

	/**
	 * Default input mappings.
	 *
	 * These are the default inputs used for each action.
	 *
	 * @type {Object}
	 */
	static defaults = {};

	/**
	 * Construct the Device.
	 *
	 * Base constructor for input devices.
	 *
	 * @returns {Device} The constructed Device instance.
	 */
	constructor() {
		return this.set();
	}

	/**
	 * Initialize Device (default no-op) and support chaining.
	 *
	 * @returns {Device}
	 */
	set = () => {
		return this.reset();
	}

	/**
	 * Reset the Device (default no-op) and support chaining.
	 *
	 * @returns {Device} this
	 */
	reset = () => {
		return this;
	}

	/**
	 * Tick through time.
	 *
	 * Subclasses should implement device-specific polling logic.
	 */
	tick = () => {}

	/**
	 * Check if a logical action is pressed.
	 *
	 * @param {String} action - The action name (e.g. 'left', 'jump').
	 * @returns {Boolean} True if the action is pressed.
	 */
	pressed = (
		action = ''
	) => {
		return false;
	}

	/**
	 * Get axes values.
	 *
	 * @returns {Array} Array of axis values [x, y].
	 */
	axes = () => {
		return [
			0,
			0,
		];
	}

	/**
	 * Get the class name for this input device.
	 *
	 * @returns {String} The class name.
	 */
	name = () => {
		return this?.constructor?.name || '';
	}

	/**
	 * Get default mappings for this input device.
	 *
	 * @returns {Object} Default mappings.
	 */
	defaults = () => {
		return this?.constructor?.defaults || {};
	}

	/**
	 * Get override mappings for this input device.
	 *
	 * @returns {Object} Override mappings.
	 */
	overrides = () => {
		return Settings?.interfaces?.inputs?.[ this.name().toLowerCase() ] || {};
	}

	/**
	 * Merge input settings with defaults.
	 *
	 * @returns {Array} Merged array of input settings.
	 */
	actions = () => {

		// Get defaults and overrides.
		const defaults  = this.defaults();
		const overrides = this.overrides();

		// Default return value.
		const retval = {};

		// Merge keys.
		const keys = new Set( [
			...Object.keys( defaults ),
			...Object.keys( overrides ),
		] );

		// Merge overrides into defaults.
		for ( const key of keys ) {
			const hasOverride = Object.prototype.hasOwnProperty.call( overrides, key );
			const value = hasOverride
				? overrides[ key ]
				: defaults[ key ];

			// Treat null/false as disable.
			if (
				( value === null )
				||
				( value === false )
			) {
				// Treat as disabled.
				retval[ key ] = [];

				// Skip.
				continue;
			}

			// Set normalized value.
			retval[ key ] = value;
		}

		// Return merged array.
		return retval;
	}
}