import Settings from '../../custom/settings.js';
import Point    from './point.js';

/**
 * The Scale object.
 *
 * This object is responsible for scaling values to best support different aspect
 * ratios, pixel densities, etc...
 */
export default class Scale extends Point {

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

		// Set the tile size in pixels.
		this.size = Settings.tileSize
			?? 32; // Fallback

		// Set the pixel ratio.
		this.dpr = devicePixelRatio
			?? 2; // Fallback

		// Set the default value.
		this.value = 1;

		// Set the pixel-to-size ratio.
		this.ratio = ( this.size * this.dpr );
	}

	/**
	 * Scale ratio up by a number.
	 *
	 * @param   {Number} n Default 1.
	 * @returns {Number} The scaled number.
	 */
	up = (
		n = 1
	) => {
		this.value = n;

		return Math.floor( n * this.ratio );
	}

	/**
	 * Scale ratio down by a number.
	 *
	 * @param   {Number} n Default 1.
	 * @returns {Number} The scaled number.
	 */
	down = (
		n = 1
	) => {
		this.value = n;

		return Math.floor( n / this.ratio );
	}
}
