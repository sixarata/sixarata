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
	 * Reset Friction.
	 */
	reset = () => {
		this.base  = ( Settings.physics.friction / 100 );
		this.scale = new Scale();
		this.force = this.base;
	}
}
