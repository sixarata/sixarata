/* global performance */
import Game from '../game.js';
import Settings from '../../custom/settings.js';

/**
 * The Frames object.
 *
 * This object is responsible for animation frames, gamespeed, throttling,
 * and calculating the framerate for display purposes.
 *
 * By default, the goal is 60 frames-per-second, but ultimately the browser
 * will determine the actual frame rate depending on a few factors, such as
 * the device's capabilities, the browser's performance, etc...
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
		this.perf     = performance;
		this.now      = this.perf.now();
		this.history  = [ this.now ];

		// Rate.
		this.throttle = 0.5;
		this.second   = 1000;
		this.goal     = Settings.gameSpeed ?? 60;
		this.step     = ( this.second / this.goal );

		// Start.
		this.current  = this.request();
	}

	/**
	 * Trigger the Frames hooks.
	 */
	hooks = () => {

		// Loop.
		Game.Hooks.add( 'Frames.animate', this.tick,   2 );
		Game.Hooks.add( 'Frames.animate', this.update, 4 );
		Game.Hooks.add( 'Frames.animate', this.render, 6 );

		// Self.
		Game.Hooks.add( 'Frames.tick',   this.counter, 10 );
		Game.Hooks.add( 'Frames.render', this.request, 10 );
	}

	/**
	 * Tick through time.
	 */
	tick = () => {
		Game.Hooks.do( 'Frames.tick' );
	}

	/**
	 * Update the Frames.
	 */
	update = () => {
		Game.Hooks.do( 'Frames.update' );
	}

	/**
	 * Render the Frames.
	 */
	render = () => {
		Game.Hooks.do( 'Frames.render' );
	}

	/**
	 * Animate the Frames.
	 *
	 * @param {DOMHighResTimeStamp} now
	 */
	animate = (
		now = 0
	) => {

		// Set now.
		this.now = now;

		// Loop.
		Game.Hooks.do( 'Frames.animate' );
	}

	/**
	 * Update the Frames history.
	 */
	counter = () => {

		// Set the expired threshold.
		const expired = ( this.now - this.second );

		// Add now frame to history.
		this.history.push( this.now );

		// Remove expired frames from history.
		this.history = this.history.filter( frame => ( frame > expired ) );
	}

	/**
	 * Request a new frame (from the browser window).
	 *
	 * @returns {requestAnimationFrame}
	 */
	request = () => {
		return requestAnimationFrame( this.animate );
	};

	/**
	 * Cancel the current frame (from the browser window).
	 *
	 * @returns {cancelAnimationFrame}
	 */
	cancel = () => {
		return cancelAnimationFrame( this.current );
	}

	/**
	 * Return the frames-per-second measurement.
	 *
	 * @returns {Number}
	 */
	fps = () => {
		return this.history.length;
	}

	/**
	 * Return the delta speed.
	 *
	 * Used for offsetting movement calculations, relative to frame rate.
	 *
	 * @param   {Number} value Default 0.
	 * @returns {Number} The compensated value.
	 */
	compensate = (
		value = 0
	) => {

		// Return the value multiplied by either: half, or the difference.
		return ( value * Math.max( this.throttle, this.diff() ) );
	}

	/**
	 * Get the difference to compensate for.
	 *
	 * @returns {Number} The difference between frames in the history.
	 */
	diff = () => {
		const
			add = (
				( x = 0, y = 0 ) => x + y
			),
			sum = (
				( xs = [] ) => xs.reduce( add, 0 )
			),
			average = (
				( xs = [] ) => xs[ 0 ] === undefined
					? NaN
					: ( sum( xs ) / xs.length )
			),
	  		delta = (
				( [ x = 0, ...xs ] ) => xs.reduce(
					(
						[ acc, last ],
						x
					) => [
						[ ...acc, x-last ],
						x
					],
					[ [], x ]
				) [ 0 ]
			),
			diff = average( delta( this.history ) ),
			ret  = ( diff / this.step );

		return ret;
	}
}
