import Settings from '../settings.js';
import Scale    from './scale.js';

/**
 * The Gravity object.
 *
 * This object is responsible for scaling Gravity to the Room.
 */
export default class Gravity {

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
	 * Reset Gravity.
	 */
	reset = () => {
		this.base  = ( Settings.physics.gravity / 100 );
		this.scale = new Scale();
		this.force = this.base;
	}
}
