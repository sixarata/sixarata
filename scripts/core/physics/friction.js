import Settings from '../../custom/settings.js';
import Scale from './scale.js';

/**
 * The Friction object.
 *
 * This object is responsible for scaling Friction to the Room.
 */
export default class Friction {

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
		this.reset();

		// Return.
		return this;
	}

	/**
	 * Reset Friction.
	 *
	 * @returns {Friction}
	 */
	reset = () => {

		// Get from Settings, or default.
		const f = Settings.physics.friction
			?? 65;

		this.base  = ( f / 100 );
		this.force = this.base;

		// Return
		return this;
	}
}
