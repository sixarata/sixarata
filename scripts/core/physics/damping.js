import Settings from '../../content/settings.js';

/**
 * Velocity damping applied while no movement input is active.
 *
 * This is a dimensionless decay coefficient, not a friction force. Values
 * closer to 1 preserve more velocity per nominal 60 Hz simulation step. The
 * Kinematics integrator converts it into a refresh-rate-independent decay.
 */
export default class Damping {

	/**
	 * Default damping settings.
	 *
	 * @type {Object}
	 */
	static defaults = {
		coefficient: 0.65,
	}

	/**
	 * Construct the object.
	 *
	 * @returns {Damping}
	 */
	constructor() {
		return this.reset();
	}

	/**
	 * Set the object.
	 *
	 * @returns {Damping}
	 */
	set = () => this.reset();

	/**
	 * Reset Damping.
	 *
	 * @returns {Damping}
	 */
	reset = () => {
		const configured = Settings.physics?.damping
			?? Settings.physics?.friction;
		const normalized = configured === undefined
			? Damping.defaults.coefficient
			: configured / 100;

		this.coefficient = Math.min( 1, Math.max( 0, normalized ) );

		return this;
	}
}
