/**
 * Integrate motion in logical world units using elapsed seconds.
 *
 * Positions are expressed in logical pixels, velocities in logical pixels per
 * second, and accelerations in logical pixels per second squared. Device pixel
 * ratio deliberately has no place in these calculations.
 */
export default class Kinematics {

	/**
	 * Calculate the signed distance traveled at a constant velocity.
	 *
	 * In kinematics, displacement is the change in position. For example,
	 * 300 px/s for 0.5 seconds produces 150 logical pixels; a negative velocity
	 * produces a negative displacement.
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
	 * Advance a position using a velocity and elapsed time.
	 *
	 * This mutates and returns `position`. “Integrate” is the standard physics
	 * term for accumulating a rate over time; here it is simply
	 * `position += velocity * seconds` on each axis.
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
	 * Advance a velocity using an acceleration and elapsed time.
	 *
	 * This mutates and returns `velocity`, applying
	 * `velocity += acceleration * seconds` on each axis.
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

}
