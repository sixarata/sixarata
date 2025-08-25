import Settings   from '../../custom/settings.js';
import Point      from './point.js';
import Coordinate from './coordinate.js';

/**
 * The Scale object.
 *
 * This object is responsible for scaling values to best support different aspect
 * ratios, pixel densities, etc...
 */
export default class Scale extends Point {

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
	 */
	constructor(
		x = 0,
		y = 0,
		z = 0
	) {
		super( x, y, z );
		this.set();
	}

	/**
	 * Set the object.
	 */
	set = () => {
		this.reset();
	}

	/**
	 * Reset Scale.
	 */
	reset = () => {

		// Get the scale settings.
		this.settings = Settings.scale ?? Scale.defaults;

		// Get the physics ratio.
		this.ratio = this.settings.size;
	}

	/**
	 * Scale coordinate up by the ratio.
	 *
	 * @param   {Coordinate} n A coordinate to scale.
	 * @returns {Coordinate}   A new scaled coordinate.
	 */
	up = ( c ) => {
		return new Coordinate( Math.floor( c.value * this.ratio ) );
	}

	/**
	 * Scale coordinate down by the ratio.
	 *
	 * @param   {Coordinate} n A coordinate to scale.
	 * @returns {Coordinate}   A new scaled coordinate.
	 */
	down = ( c ) => {
		return new Coordinate( Math.floor( c.value / this.ratio ) );
	}
}
