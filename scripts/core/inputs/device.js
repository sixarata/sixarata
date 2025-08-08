import Settings from '../../custom/settings.js';

/**
 * Abstract Input base class.
 *
 * Provides the interface for all input devices. Subclasses should implement
 * poll(), pressed(), and axes() to provide device-specific input logic.
 */
export default class Input {

    /**
     * Default key mappings.
     *
     * These are the default keys used for each action.
     *
     * @type {Object}
     */
    static defaults = {};

    /**
     * Construct the Input.
     *
     * Base constructor for input devices.
     */
    constructor() {}

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
            0
        ];
    }

    /**
     * Get the class name for this input device.
     *
     * @returns {String} The class name.
     */
    name = () => {

        // Derive name from class name.
        const ctor = this?.constructor;
        const name = ( ctor && ctor.name ) || '';

        // Return the derived name.
        return name;
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
        return Settings?.inputs?.[ this.name() ] || {};
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
            ...Object.keys( overrides )
        ] );

        // Merge overrides into defaults.
        for ( const key of keys ) {
            const hasOverride = Object.prototype.hasOwnProperty.call( overrides, key );
            const value       = hasOverride
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