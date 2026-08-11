import Settings from '../../content/settings.js';

/**
 * The Gravity object.
 *
 * Stores gravitational acceleration in logical pixels per second squared.
 */
export default class Gravity {

	/**
	 * Default gravity settings.
	 *
	 * @type {Object}
	 */
	static defaults = {
		acceleration: 1440,
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
