import Settings from '../settings.js';
import Game     from '../game.js';

/**
 * The Frames object.
 *
 * This object is responsible for keeping track of the frames and gamespeed.
 *
 * Generally, the goal is 60 frames-per-second, though that can be
 * adjusted.
 */
export default class Frames {

	/**
	 * Construct the object.
	 */
	constructor() {
		this.set();
	}

	/**
	 * Set the object.
	 */
	set = () => {
		this.reset();
	}

	/**
	 * Reset the Frames.
	 */
	reset = () => {

		// Performance.
		this.perf    = performance;
		this.now     = this.perf.now();
		this.frames  = [ this.now ];

		// Rate.
		this.rate    = Settings.gameSpeed;
		this.step    = ( 1000 / this.rate );
		this.request = requestAnimationFrame( this.animate );
	}

	/**
	 * Animate the Frames.
	 *
	 * @param {DOMHighResTimeStamp} now
	 */
	animate = ( now = 0 ) => {

		// Set now.
		this.now = now;

		// Add new frame.
		this.frames.push( now );

		// Remove expired frames.
		while ( ( this.frames.length >= 0 ) && ( this.frames[ 0 ] <= ( now - 1000 ) ) ) {
			this.frames.shift();
		}

		// Loop.
		Game.Hooks.do( 'Frames.tick'   );
		Game.Hooks.do( 'Frames.update' );
		Game.Hooks.do( 'Frames.render' );

		// Paint.
		this.request = requestAnimationFrame( this.animate );
	}

	/**
	 * Return the frames-per-second measurement.
	 *
	 * @returns {Int}
	 */
	fps = () => {
		return this.frames.length;
	}

	/**
	 * Return the delta speed.
	 *
	 * Used for offsetting movement calculations, relative to fps.
	 *
	 * @param {Int} value
	 * @returns {Int}
	 */
	compensate = ( value = 0 ) => {
		return ( value * Math.max( 0.5, this.diff() ) );
	}

	/**
	 * Get the difference to compensate for.
	 *
	 * @returns {Int}
	 */
	diff = () => {
		const
			add     = ( ( x, y ) => x + y ),
			sum     = ( xs => xs.reduce( add, 0 ) ),
			average = ( xs => xs[ 0 ] === undefined
				? NaN
				: sum( xs ) / xs.length ),
	  		delta   = ( ( [ x, ...xs ] ) => xs.reduce(
					(
						[ acc, last ],
						x
					) => [
						[ ...acc, x-last ],
						x
					],
					[ [], x ]
				) [ 0 ] ),
			diff    = average( delta( this.frames ) ),
			ret     = ( diff / this.step );

		return ret;
	}
}
