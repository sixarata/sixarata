import Settings from '../../content/settings.js';

/**
 * The Gravity object.
 *
 * This object is responsible for scaling Gravity to the Room.
 */
export default class Gravity {

	/**
	 * Default gravity settings.
	 *
	 * @type {Object}
	 */
	static defaults = {
		force: 80,
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
		const g = Settings.physics?.gravity ?? Gravity.defaults.force;

		// Set properties.
		this.base  = ( g / 100 );
		this.force = this.base;

		// Return.
		return this;
	}
}
