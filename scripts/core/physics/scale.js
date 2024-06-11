import Settings from '../settings.js';
import Point    from './point.js';

/**
 * The Scale object.
 *
 * This object is responsible for scaling values to best support different aspect
 * ratios, pixel densities, etc...
 */
export default class Scale extends Point {

	/**
	 * The Scale x.
	 *
	 * @type {Number} Default 1.
	 */
	x = 1;

	/**
	 * The Scale y.
	 *
	 * @type {Number} Default 1.
	 */
	y = 1;

	/**
	 * The Scale z.
	 *
	 * @type {Number} Default 1.
	 */
	z = 1;

	/**
	 * Construct the Scale.
	 *
	 * @param {Number} x Default 1.
	 * @param {Number} y Default 1.
	 * @param {Number} z Default 1.
	 */
	constructor(
		x = 1,
		y = 1,
		z = 1
	) {
		super( x, y, z );

		// Set the size.
		this.size = Settings.tileSize;

		// Set the pixel ratio.
		this.dpr = devicePixelRatio;

		// Set the pixel-to-size ratio.
		this.ratio = ( this.size * this.dpr );
	}

	/**
	 * Scale ratio up by a number.
	 *
	 * @param   {Number} number Default 1.
	 * @returns {Number} The scaled number.
	 */
	up = (
		number = 1
	) => {
		return Math.floor( number * this.ratio );
	}

	/**
	 * Scale ratio down by a number.
	 *
	 * @param   {Number} number
	 * @returns {Number} The scaled number.
	 */
	down = (
		number = 1
	) => {
		return Math.floor( number / this.ratio );
	}
}
