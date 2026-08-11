import Settings from '../../content/settings.js';

/**
 * The Gravity object.
 *
 * Stores the default gravitational acceleration in logical pixels per second
 * squared. It provides the world baseline; future materials or Tile sides may
 * modify the effective acceleration without changing this global value.
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
