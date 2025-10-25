import Settings from '../../content/settings.js';

/**
 * The Friction object.
 *
 * This object is responsible for scaling Friction to the Room.
 */
export default class Friction {

	/**
	 * Default friction settings.
	 *
	 * @type {Object}
	 */
	static defaults = {
		force: 65,
	}

	/**
	 * Construct the object.
	 *
	 * @returns {Friction}
	 */
	constructor() {
		return this.set();
	}

	/**
	 * Set the object.
	 *
	 * @returns {Friction}
	 */
	set = () => {
		return this.reset();
	}

	/**
	 * Reset Friction.
	 *
	 * @returns {Friction}
	 */
	reset = () => {

		// Get from Settings, or default.
		const f = Settings.physics?.friction ?? Friction.defaults.force;

		// Set properties.
		this.base  = ( f / 100 );
		this.force = this.base;

		// Return
		return this;
	}
}
