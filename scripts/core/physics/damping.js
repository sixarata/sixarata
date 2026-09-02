import Settings from '../../content/settings.js';

/**
 * Refresh-rate-independent smoothing and velocity damping.
 *
 * Damping is not a friction force. Its dimensionless retention says how much
 * of a value remains after one calibrated step. Repeating that retention for
 * the elapsed duration produces identical behavior at different frame rates.
 *
 * This currently provides the global movement default. Material mechanics may
 * later supply local retention values for effects such as ice or quicksand.
 */
export default class Damping {

	/**
	 * Default damping calibration.
	 *
	 * @type {Object}
	 */
	static defaults = {
		retention:      0.65,
		stepsPerSecond: 60,
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
		const retention = typeof configured === 'object'
			? ( configured.retention ?? configured.coefficient )
			: configured;
		const normalized = retention === undefined
			? Damping.defaults.retention
			: ( retention > 1 ? retention / 100 : retention );

		this.retention = Math.min( 1, Math.max( 0, normalized ) );
		this.stepsPerSecond = typeof configured === 'object'
			? ( configured.stepsPerSecond
				?? configured.referenceRate
				?? Damping.defaults.stepsPerSecond )
			: Damping.defaults.stepsPerSecond;

		return this;
	}

	/**
	 * Apply exponential damping for an elapsed duration.
	 *
	 * `retention` is the fraction remaining after one calibrated step. Elapsed
	 * seconds are converted to a fractional number of those steps, so the result
	 * does not depend on how frequently frames happen to arrive.
	 *
	 * @param {Number} value     Value to damp.
	 * @param {Number} seconds   Elapsed seconds.
	 * @param {Number} retention Fraction retained per calibrated step.
	 * @returns {Number} The damped value.
	 */
	apply = (
		value     = 0,
		seconds   = 0,
		retention = this.retention
	) => {
		const normalized = Math.min( 1, Math.max( 0, Number( retention ) || 0 ) );
		const steps      = Math.max( 0, Number( seconds ) || 0 ) * this.stepsPerSecond;

		return Number( value ) * Math.pow( normalized, steps );
	}

	/**
	 * Move a value toward a target with refresh-rate-independent smoothing.
	 *
	 * @param {Number} value   Current value.
	 * @param {Number} target  Desired value.
	 * @param {Number} seconds Elapsed seconds.
	 * @param {Number} amount  Fraction of the gap closed per calibrated step.
	 * @returns {Number} The next value.
	 */
	approach = (
		value   = 0,
		target  = 0,
		seconds = 0,
		amount  = 1
	) => {
		const remaining = this.apply( 1, seconds, 1 - amount );

		return Number( target ) + ( Number( value ) - Number( target ) ) * remaining;
	}
}
