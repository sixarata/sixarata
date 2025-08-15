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
		dpr:  2
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

		// Set the tile size in pixels.
		this.size = this.settings.size;

		// Set the pixel ratio.
		this.dpr = devicePixelRatio
			?? this.settings.dpr;

		// Set the pixel-to-size ratio.
		this.ratio = ( this.size * this.dpr );
	}

	/**
	 * Scale ratio up by a number.
	 *
	 * @param   {Coordinate} n Default 1.
	 * @returns {Coordinate} A new scaled coordinate.
	 */
	up = ( c ) => {
		return new Coordinate( Math.floor( c.value * this.ratio ) );
	}

	/**
	 * Scale ratio down by a number.
	 *
	 * @param   {Coordinate} n Default 1.
	 * @returns {Coordinate} A new scaled coordinate.
	 */
	down = ( c ) => {
		return new Coordinate( Math.floor( c.value / this.ratio ) );
	}
}
