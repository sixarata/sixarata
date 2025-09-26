import Settings from '../../custom/settings.js';
import Scale from './scale.js';

/**
 * The Gravity object.
 *
 * This object is responsible for scaling Gravity to the Room.
 */
export default class Gravity {

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
		const g = Settings.physics.gravity
			?? 80;

		this.base  = ( g / 100 );
		this.force = this.base;
	}
}
