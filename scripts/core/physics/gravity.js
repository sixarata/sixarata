import Settings from '../../content/settings.js';

/**
 * The Gravity object.
 *
 * Stores gravitational acceleration in tiles per second squared. Mechanics
 * convert this world-relative value through Screen before changing a logical-
 * pixel velocity. Future materials may modify the effective acceleration
 * without changing the shared baseline.
 */
export default class Gravity {

	/**
	 * Default gravity settings.
	 *
	 * @type {Object}
	 */
	static defaults = {
		acceleration: 45,
	}

	/**
	 * Construct the object.
	 *
	 * @returns {Gravity}
	 */
	constructor() {
		return this.set();
	}

	/**
	 * Set the object.
	 *
	 * @returns {Gravity}
	 */
	set = () => {
		return this.reset();
	}

	/**
	 * Reset Gravity.
	 *
	 * @returns {Gravity}
	 */
	reset = () => {

		// Get from Settings, or default.
		this.acceleration = Settings.physics?.gravity
			?? Gravity.defaults.acceleration;

		// Return.
		return this;
	}
}
