import Settings   from '../../content/settings.js';
import Vector from './vector.js';

/**
 * The Scale object.
 *
 * This object is responsible for scaling values to best support different aspect
 * ratios, pixel densities, etc...
 */
export default class Scale extends Vector {

	/**
	 * Default scale settings.
	 *
	 * These settings are used to configure the scale object.
	 *
	 * @type {Object}
	 */
	static defaults = {
		size: 32,
	}

	/**
	 * Construct the Scale.
	 *
	 * @param {Number} x Default 0.
	 * @param {Number} y Default 0.
	 * @param {Number} z Default 0.
	 * @returns {Scale} This Scale object.
	 */
	constructor(
		x = 0,
		y = 0,
		z = 0
	) {
		super( x, y, z );

		// Return.
		return this.set();
	}

	/**
	 * Set the object.
	 *
	 * @returns {Scale} this
	 */
	set = () => {
		return this.reset();
	}

	/**
	 * Reset Scale.
	 *
	 * @returns {Scale} this
	 */
	reset = () => {

		// Get the scale settings.
		this.settings = Settings.interfaces?.screen ?? Scale.defaults;

		// Get the physics ratio.
		this.ratio = this.settings.size;

		// Return.
		return this;
	}

	/**
	 * Scale coordinate up by the ratio.
	 *
	 * @param   {Number} c A coordinate to scale.
	 * @returns {Number}   A new scaled coordinate.
	 */
	up = ( c ) => {
		return Math.floor( Number( c ) * this.ratio );
	}

	/**
	 * Scale coordinate down by the ratio.
	 *
	 * @param   {Number} c A coordinate to scale.
	 * @returns {Number}   A new scaled coordinate.
	 */
	down = ( c ) => {
		return Math.floor( Number( c ) / this.ratio );
	}
}
