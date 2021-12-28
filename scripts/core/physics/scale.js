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
	 * Construct the Scale.
	 *
	 * @param {Int} x
	 * @param {Int} y
	 */
	constructor( x = 1, y = 1 ) {
		super( x, y );

		// Set the size.
		this.size = Settings.tileSize;

		// Set the pixel ratio.
		this.dpr = devicePixelRatio;

		// Set the pixel-to-size ratio.
		this.ratio = ( this.size * this.dpr );
	}

	/**
	 * Scale up an Integer.
	 *
	 * @param {Int} int 
	 * @returns {Int}
	 */
	up = ( int = 1 ) => {
		return Math.floor( int * this.ratio );
	}

	/**
	 * Scale down an Integer.
	 *
	 * @param {Int} int 
	 * @returns {Int}
	 */
	down = ( int = 1 ) => {
		return Math.floor( int / this.ratio );
	}
}
