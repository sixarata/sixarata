import Time from './time.js';

/**
 * Timer
 *
 * Designed for repeated short intervals, with:
 * - Scaled time source (uses Time.now)
 * - Pause / resume without drift
 * - Optional repeating interval support
 * - Chainable methods for terse usage
 * - Introspection helpers (left, elapsed, ratio, active, done)
 */
export default class Timer {

	/**
	 * Timer constructor.
	 *
	 * @param {Number} ms Duration in ms (<=0 clears).
	 */
	constructor(
		ms = 0
	) {
		return this.set( ms );
	}

	/**
	 * Set with duration.
	 *
	 * @param {Number} ms Duration in ms (<=0 clears).
	 * @returns {Timer} this
	 */
	set = (
		ms = 0
	) => {

		// Reset.
		this.reset();

		// Apply new timing window.
		this.starts   = Time.now;
		this.duration = ms;
		this.expires  = this.starts + ms;

		// Return.
		return this;
	}

	/**
	 * Internal reset (use clear() externally for semantics).
	 *
	 * @returns {Timer} this
	 */
	reset = () => {

		// Defaults.
		this.starts   = 0;
		this.duration = 0;
		this.expires  = 0;
		this.remains  = 0;
		this.paused   = false;
		this.interval = 0;

		// Return.
		return this;
	}

	/**
	 * Alias for set().
	 *
	 * @param {Number} ms Duration ms.
	 * @returns {Timer} this
	 */
	start = ( ms = 0 ) => this.set( ms );

	/**
	 * Clear / deactivate.
	 *
	 * @returns {Timer} this
	 */
	clear = () => this.reset();

	/**
	 * Alias for clear().
	 *
	 * @returns {Timer} this
	 */
	stop = () => this.clear();

	/**
	 * True while counting down.
	 *
	 * @returns {Boolean}
	 */
	active = () => ( ! this.paused && this.expires > 0 && Time.now < this.expires );

	/**
	 * True when expired (and not paused).
	 *
	 * @returns {Boolean}
	 */
	done = () => ( ! this.paused && this.expires > 0 && Time.now >= this.expires );

	/**
	 * Remaining milliseconds.
	 *
	 * @returns {Number}
	 */
	left = () => ( this.active()
		? ( this.expires - Time.now )
		: 0 );

	/**
	 * Alias for left().
	 *
	 * @returns {Number}
	 */
	remain = () => this.left();

	/**
	 * Elapsed milliseconds (clamped to duration).
	 *
	 * @returns {Number}
	 */
	elapsed = () => {

		// Return 0 if no time.
		if ( ! this.expires ) {
			return 0;
		}

		// Return.
		if ( this.paused ) {
			return this.duration - this.remains;
		}

		// Compute elapsed.
		const e = Time.now - this.starts;

		// Clamp.
		return ( e < 0
			? 0
			: ( e > this.duration
				? this.duration
				: e
			) );
	}

	/**
	 * Progress ratio 0..1.
	 *
	 * @returns {Number}
	 */
	ratio = () => ( this.duration > 0
		? ( this.elapsed() / this.duration )
		: 0 );

	/**
	 * Pause (capture remaining).
	 *
	 * @returns {Timer} this
	 */
	pause = () => {

		// Only if running.
		if ( ! this.paused && this.expires > 0 ) {

			// Capture remaining time.
			this.remains = this.expires - Time.now;

			// Clamp.
			if ( this.remains < 0 ) {
				this.remains = 0;
			}

			// Set paused flag.
			this.paused = true;
		}

		// Return.
		return this;
	}

	/**
	 * Resume (recompute expiry from remaining).
	 *
	 * @returns {Timer} this
	 */
	resume = () => {

		// Only if paused.
		if ( this.paused ) {

			// Restore expiry from remaining time.
			if ( this.remains > 0 ) {
				this.starts  = Time.now - ( this.duration - this.remains );
				this.expires = Time.now + this.remains;

			// Clear if no remaining time.
			} else {
				this.expires  = 0;
				this.duration = 0;
			}

			// Clear remaining and paused flag.
			this.remains = 0;
			this.paused  = false;
		}

		// Return.
		return this;
	}

	/**
	 * Set / update repeat interval (ms).
	 *
	 * @param   {Number} ms Interval in ms (0 disables).
	 * @returns {Timer} this
	 */
	repeat = (
		ms = 0
	) => {

		// Apply interval.
		this.interval = ms;

		// Start immediately if interval active and done
		if ( this.interval > 0 && this.done() ) {
			this.starts   = Time.now;
			this.duration = this.interval;
			this.expires  = this.starts + this.interval;
		}

		// Return.
		return this;
	}

	/**
	 * Advance repeat cycle if expired.
	 *
	 * True exactly once per interval boundary.
	 *
	 * @returns {Boolean}
	 */
	ping = () => {

		// Check if interval is active and done
		if ( this.interval > 0 && this.done() ) {
			this.starts   = Time.now;
			this.duration = this.interval;
			this.expires  = this.starts + this.interval;

			// Done.
			return true;
		}

		// Not done.
		return false;
	}

	/**
	 * Extend remaining time by ms (restarts if previously done).
	 *
	 * @param   {Number} ms Additional milliseconds.
	 * @returns {Timer} this
	 */
	extend = (
		ms = 0
	) => {

		// Skip if no time.
		if ( ms <= 0 ) {
			return this;
		}

		// Capture remaining time if paused.
		if ( this.paused ) {
			this.remains += ms;

		// Extend active timer.
		} else if ( this.active() ) {
			this.expires += ms;
			this.duration += ms;

		// Restart if done.
		} else if ( this.done() ) {
			this.set( ms );
		}

		// Return.
		return this;
	}

	/**
	 * Reduce remaining time by ms (clamped to zero).
	 *
	 * @param   {Number} ms Milliseconds to remove.
	 * @returns {Timer} this
	 */
	reduce = (
		ms = 0
	) => {

		// Skip if no time.
		if ( ms <= 0 ) {
			return this;
		}

		// Reduce remaining time if paused.
		if ( this.paused ) {
			this.remains = Math.max( 0, this.remains - ms );

		// Reduce active timer.
		} else if ( this.active() ) {
			this.expires -= ms;
			this.duration = Math.max( 0, this.duration - ms );

			// Clamp expiry.
			if ( this.expires <= Time.now ) {
				this.expires = Time.now;
			}
		}

		// Return.
		return this;
	}

	/**
	 * Shift entire timing window by ms (positive or negative).
	 *
	 * @param   {Number} ms Offset in ms.
	 * @returns {Timer} this
	 */
	shift = (
		ms = 0
	) => {

		// Skip if no time.
		if ( ms <= 0 ) {
			return this;
		}

		// Skip if no time.
		if ( ! this.expires ) {
			return this;
		}

		// Add time.
		this.starts  += ms;
		this.expires += ms;

		// Return.
		return this;
	}
}
