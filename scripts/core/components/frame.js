import Game from '../game.js';
import Time from '../utilities/time.js';
import Settings from '../../custom/settings.js';

/**
 * The Frame object.
 *
 * This object is responsible for animation frames, gamespeed, throttling,
 * and calculating the framerate for display purposes.
 *
 * By default, the goal is 60 frames-per-second, but ultimately the browser
 * will determine the actual frame rate depending on a few factors, such as
 * the device's capabilities, the browser's performance, etc...
 */
export default class Frame {

	/**
	 * Default Frame settings.
	 *
	 * These are overridden by Settings.components.frames.
	 *
	 * @type {Object}
	 */
	static defaults = {
		throttle: 0.5,
		second:   1000,
		goal:     60,
		clamp:    5,
	}

	/**
	 * Construct the object.
	 */
	constructor() {
		this.set();
		this.listen();
	}

	/**
	 * Set the object.
	 */
	set = () => {
		this.reset();
	}

	/**
	 * Reset the Frame.
	 */
	reset = () => {

		// Time.
		Time.update();

		// History.
		this.history  = [ Time.now ];

		// Settings.
		this.settings = Settings.components.frames ?? Frame.defaults;

		// Step.
		this.step     = ( this.settings.second / this.settings.goal );

		// Exponential moving average.
		this.ema = 1;

		// Start.
		this.current  = this.request();
	}

	/**
	 * Add the Listeners.
	 */
	listen = () => {

		// Listen for visibility changes.
		addEventListener(
			'visibilitychange',
			this.visibility,
			false
		);
	}

	/**
	 * Trigger the Frames hooks.
	 */
	hooks = () => {

		// Loop.
		Game.Hooks.add( 'Frame.animate', this.tick,   2 );
		Game.Hooks.add( 'Frame.animate', this.update, 4 );
		Game.Hooks.add( 'Frame.animate', this.render, 6 );

		// Self.
		Game.Hooks.add( 'Frame.tick',   this.counter, 10 );
		Game.Hooks.add( 'Frame.render', this.request, 10 );
	}

	/**
	 * Tick through time.
	 */
	tick = () => {
		Game.Hooks.do( 'Frame.tick' );
	}

	/**
	 * Update the Frame.
	 */
	update = () => {
		Game.Hooks.do( 'Frame.update' );
	}

	/**
	 * Render the Frame.
	 */
	render = () => {
		Game.Hooks.do( 'Frame.render' );
	}

	/**
	 * Animate the Frame.
	 *
	 * @param {DOMHighResTimeStamp} now From performance.now()
	 */
	animate = (
		now = 0
	) => {

		// Set per-frame time & delta.
		Time.update( now );

		// Set Time diff to raw diff.
		Time.diff  = this.rawDiff();
		Time.scale = Math.max( this.settings.throttle, Time.diff );

		// Loop.
		Game.Hooks.do( 'Frame.animate' );
	}

	/**
	 * Update the Frame history.
	 */
	counter = () => {

		// Set the expired threshold.
		const expired = ( Time.now - this.settings.second );

		// Add now frame to history.
		this.history.push( Time.now );

		// Remove expired frames from history.
		this.history = this.history.filter( frame => ( frame > expired ) );
	}

	/**
	 * Request a new frame (from the browser window).
	 *
	 * @returns {requestAnimationFrame} The requested frame.
	 */
	request = () => {
		return requestAnimationFrame( this.animate );
	};

	/**
	 * Cancel the current frame (from the browser window).
	 *
	 * @returns {cancelAnimationFrame} The cancelled frame.
	 */
	cancel = () => {
		return cancelAnimationFrame( this.current );
	}

	/**
	 * Return the frames-per-second measurement.
	 *
	 * @returns {Number} The current FPS.
	 */
	fps = () => {
		return this.history.length;
	}

	/**
	 * Frame-based difference based on frame timestamp history.
	 *
	 * @returns {Number} The difference between frames in the history.
	 */
	diff = () => {

		// Need at least two frames to establish a delta.
		if ( this.history.length < 2 ) {
			return 1;
		}

		// Helper functions.
		const add     = ( x = 0, y = 0 ) => x + y;
		const sum     = ( xs = [] ) => xs.reduce( add, 0 );
		const average = ( xs = [] ) => xs[ 0 ] === undefined
			? NaN
			: ( sum( xs ) / xs.length );
		const delta   = ( [ x = 0, ...xs ] ) => xs.reduce(
				(
					[ acc, last ],
					x,
				) => [
					[ ...acc, x - last ],
					x,
				],
				[ [], x ]
			)[ 0 ];

		// Compute the difference.
		const diff = average( delta( this.history ) );
		let ret    = ( diff / this.step );

		// Guard against NaN / Infinity / non-positive values.
		if ( ! Number.isFinite( ret ) || ret <= 0 ) {
			ret = 1;
		}

		// Clamp extreme spikes, to avoid teleporting.
		if ( ret > this.settings.clamp ) {
			ret = this.settings.clamp;
		}

		// Return the frame diff value.
		return ret;
	}

	/**
	 * Instantaneous (raw) time-based diff using last frame delta.
	 *
	 * @returns {Number}
	 */
	rawDiff = () => {

		// Compute raw time-based diff.
		let d = ( Time.delta / this.step );

		// Avoid NaN, Infinity, negative values.
		if (
			! Number.isFinite( d )
			||
			( d <= 0 )
		) {
			d = 1;
		}

		// Clamp extreme spikes, to avoid teleporting.
		if ( d > this.settings.clamp ) {
			d = this.settings.clamp;
		}

		// Clamp minimum value, to avoid stalling.
		if ( d < this.settings.throttle ) {
			d = this.settings.throttle;
		}

		// Return the final value.
		return d;
	}

	/**
	 * Exponential moving average of time-based diff (reduces jitter).
	 *
	 * @param {Number} alpha Smoothing factor (0 < a <= 1).
	 *                       Lower = more smoothing.
	 * @returns {Number}
	 */
	emaDiff = (
		alpha = 0.15
	) => {

		// Calculate the EMA.
		this.ema = ( Time.diff * alpha ) + ( this.ema * ( 1 - alpha ) );

		// Return the smoothed value.
		return this.ema;
	}

	/**
	 * Handle page visibility changes to prevent giant deltas.
	 *
	 * @returns {void}
	 */
	visibility = () => {

		// Pause the frame updates.
		if ( document.hidden ) {
			this.paused = Time.now;
			return;
		}

		// Time.
		Time.update();

		// History.
		this.history = [ Time.now ];
	}
}
