/**
 * Integrate motion in logical world units using elapsed seconds.
 *
 * Positions are expressed in logical pixels, velocities in logical pixels per
 * second, and accelerations in logical pixels per second squared. Device pixel
 * ratio deliberately has no place in these calculations.
 */
export default class Kinematics {

	/**
	 * Default Kinematics settings.
	 *
	 * @type {Object}
	 */
	static defaults = {
		nominalRate: 60,
	}

	/**
	 * Construct the object.
	 *
	 * @param {Number} nominalRate
	 */
	constructor(
		nominalRate = Kinematics.defaults.nominalRate
	) {
		this.nominalRate = nominalRate;
	}

	/**
	 * Convert milliseconds to seconds.
	 *
	 * @param {Number} milliseconds
	 * @returns {Number}
	 */
	seconds = (
		milliseconds = 0
	) => Math.max( 0, Number( milliseconds ) || 0 ) / 1000;

	/**
	 * Calculate displacement over elapsed time.
	 *
	 * @param {Number} velocity
	 * @param {Number} seconds
	 * @returns {Number}
	 */
	displacement = (
		velocity = 0,
		seconds  = 0
	) => Number( velocity ) * Math.max( 0, Number( seconds ) || 0 );

	/**
	 * Integrate velocity into position.
	 *
	 * @param {Object} position
	 * @param {Object} velocity
	 * @param {Number} seconds
	 * @returns {Object} position
	 */
	integrate = (
		position = {},
		velocity = {},
		seconds  = 0
	) => {
		position.x += this.displacement( velocity.x, seconds );
		position.y += this.displacement( velocity.y, seconds );
		position.z += this.displacement( velocity.z, seconds );

		return position;
	}

	/**
	 * Integrate acceleration into velocity.
	 *
	 * @param {Object} velocity
	 * @param {Object} acceleration
	 * @param {Number} seconds
	 * @returns {Object} velocity
	 */
	accelerate = (
		velocity     = {},
		acceleration = {},
		seconds      = 0
	) => {
		velocity.x += this.displacement( acceleration.x, seconds );
		velocity.y += this.displacement( acceleration.y, seconds );
		velocity.z += this.displacement( acceleration.z, seconds );

		return velocity;
	}

	/**
	 * Apply refresh-rate-independent exponential decay.
	 *
	 * @param {Number} value
	 * @param {Number} coefficient
	 * @param {Number} seconds
	 * @returns {Number}
	 */
	decay = (
		value       = 0,
		coefficient = 1,
		seconds     = 0
	) => {
		const retention = Math.min( 1, Math.max( 0, Number( coefficient ) || 0 ) );
		const steps = Math.max( 0, Number( seconds ) || 0 ) * this.nominalRate;

		return Number( value ) * Math.pow( retention, steps );
	}

	/**
	 * Approach a target using refresh-rate-independent decay.
	 *
	 * @param {Number} value
	 * @param {Number} target
	 * @param {Number} coefficient
	 * @param {Number} seconds
	 * @returns {Number}
	 */
	approach = (
		value       = 0,
		target      = 0,
		coefficient = 1,
		seconds     = 0
	) => {
		const remaining = this.decay( 1, 1 - coefficient, seconds );

		return Number( target ) + ( Number( value ) - Number( target ) ) * remaining;
	}
}
