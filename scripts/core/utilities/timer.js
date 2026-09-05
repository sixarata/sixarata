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
	 * Shared monotonic millisecond timestamp when the current window starts.
	 *
	 * @type {Number}
	 */
	startsAt;

	/**
	 * Total length of the current timing window in milliseconds.
	 *
	 * @type {Number}
	 */
	duration;

	/**
	 * Shared monotonic millisecond timestamp when the current window expires.
	 *
	 * @type {Number}
	 */
	expiresAt;

	/**
	 * Milliseconds retained while the Timer is paused.
	 *
	 * @type {Number}
	 */
	remains;

	/**
	 * Whether countdown progress is suspended.
	 *
	 * @type {Boolean}
	 */
	paused;

	/**
	 * Repeating window duration in milliseconds, or zero when disabled.
	 *
	 * @type {Number}
	 */
	interval;

	/**
	 * Construct and immediately start a timing window.
	 *
	 * @param {Number} ms Duration in milliseconds. Non-positive values are inert.
	 * @returns {Timer} this
	 */
	constructor(
		ms = 0
	) {
		return this.set( ms );
	}

	/**
	 * Reset and start a timing window from the shared monotonic clock.
	 *
	 * @param {Number} ms Duration in milliseconds. Non-positive values are inert.
	 * @returns {Timer} this
	 */
	set = (
		ms = 0
	) => {

		// Reset.
		this.reset();

		// Apply new timing window.
		this.startsAt  = Time.now;
		this.duration  = ms;
		this.expiresAt = this.startsAt + ms;

		// Return.
		return this;
	}

	/**
	 * Restore an inactive Timer with no repeating interval.
	 *
	 * Call clear() when expressing external cancellation semantics.
	 *
	 * @returns {Timer} this
	 */
	reset = () => {

		// Defaults.
		this.startsAt  = 0;
		this.duration  = 0;
		this.expiresAt = 0;
		this.remains   = 0;
		this.paused    = false;
		this.interval  = 0;

		// Return.
		return this;
	}

	/**
	 * Start a new timing window as an alias for set().
	 *
	 * @param {Number} ms Duration in milliseconds. Defaults to zero.
	 * @returns {Timer} this
	 */
	start = ( ms = 0 ) => this.set( ms );

	/**
	 * Clear the active window, pause state, and repeating interval.
	 *
	 * @returns {Timer} this
	 */
	clear = () => this.reset();

	/**
	 * Stop timing as an alias for clear().
	 *
	 * @returns {Timer} this
	 */
	stop = () => this.clear();

	/**
	 * Determine whether an unpaused timing window is counting down.
	 *
	 * @returns {Boolean} Whether the expiration timestamp is in the future.
	 */
	active = () => ( ! this.paused && this.expiresAt > 0 && Time.now < this.expiresAt );

	/**
	 * Determine whether an unpaused timing window reached its expiration.
	 *
	 * @returns {Boolean} Whether an active expiration timestamp was reached.
	 */
	done = () => ( ! this.paused && this.expiresAt > 0 && Time.now >= this.expiresAt );

	/**
	 * Calculate the remaining duration of an active timing window.
	 *
	 * @returns {Number} Remaining milliseconds, or zero when inactive or paused.
	 */
	left = () => ( this.active()
		? ( this.expiresAt - Time.now )
		: 0 );

	/**
	 * Return remaining milliseconds as an alias for left().
	 *
	 * @returns {Number} Remaining milliseconds, or zero when inactive or paused.
	 */
	remain = () => this.left();

	/**
	 * Calculate elapsed milliseconds clamped to the configured duration.
	 *
	 * @returns {Number} Elapsed milliseconds, including captured paused progress.
	 */
	elapsed = () => {

		// Return 0 if no time.
		if ( ! this.expiresAt ) {
			return 0;
		}

		// Return.
		if ( this.paused ) {
			return this.duration - this.remains;
		}

		// Compute elapsed.
		const e = Time.now - this.startsAt;

		// Clamp.
		return ( e < 0
			? 0
			: ( e > this.duration
				? this.duration
				: e
			) );
	}

	/**
	 * Calculate completed progress through the current timing window.
	 *
	 * @returns {Number} Ratio from zero through one, or zero without a duration.
	 */
	ratio = () => ( this.duration > 0
		? ( this.elapsed() / this.duration )
		: 0 );

	/**
	 * Pause an active Timer after capturing its remaining milliseconds.
	 *
	 * @returns {Timer} this
	 */
	pause = () => {

		// Only if running.
		if ( ! this.paused && this.expiresAt > 0 ) {

			// Capture remaining time.
			this.remains = this.expiresAt - Time.now;

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
	 * Resume a paused Timer without counting time spent paused.
	 *
	 * @returns {Timer} this
	 */
	resume = () => {

		// Only if paused.
		if ( this.paused ) {

			// Restore expiry from remaining time.
			if ( this.remains > 0 ) {
				this.startsAt  = Time.now - ( this.duration - this.remains );
				this.expiresAt = Time.now + this.remains;

			// Clear if no remaining time.
			} else {
				this.expiresAt = 0;
				this.duration  = 0;
			}

			// Clear remaining and paused flag.
			this.remains = 0;
			this.paused  = false;
		}

		// Return.
		return this;
	}

	/**
	 * Set or update the repeating interval.
	 *
	 * @param {Number} ms Interval in milliseconds. Zero disables repetition.
	 * @returns {Timer} this
	 */
	repeat = (
		ms = 0
	) => {

		// Apply interval.
		this.interval = ms;

		// Start immediately if interval active and done
		if ( this.interval > 0 && this.done() ) {
			this.startsAt  = Time.now;
			this.duration  = this.interval;
			this.expiresAt = this.startsAt + this.interval;
		}

		// Return.
		return this;
	}

	/**
	 * Advance an expired repeating Timer to its next interval.
	 *
	 * True exactly once per interval boundary.
	 *
	 * @returns {Boolean} Whether a new repeat interval began.
	 */
	ping = () => {

		// Check if interval is active and done
		if ( this.interval > 0 && this.done() ) {
			this.startsAt  = Time.now;
			this.duration  = this.interval;
			this.expiresAt = this.startsAt + this.interval;

			// Done.
			return true;
		}

		// Not done.
		return false;
	}

	/**
	 * Extend an active or paused Timer, or restart an expired Timer.
	 *
	 * @param {Number} ms Additional milliseconds. Non-positive values are inert.
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
			this.expiresAt += ms;
			this.duration += ms;

		// Restart if done.
		} else if ( this.done() ) {
			this.set( ms );
		}

		// Return.
		return this;
	}

	/**
	 * Reduce active or paused time without passing the current clock.
	 *
	 * @param {Number} ms Milliseconds to remove. Non-positive values are inert.
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
			this.expiresAt -= ms;
			this.duration = Math.max( 0, this.duration - ms );

			// Clamp expiry.
			if ( this.expiresAt <= Time.now ) {
				this.expiresAt = Time.now;
			}
		}

		// Return.
		return this;
	}

	/**
	 * Shift both absolute window boundaries by a signed duration.
	 *
	 * @param {Number} ms Signed offset in milliseconds. Zero is inert.
	 * @returns {Timer} this
	 */
	shift = (
		ms = 0
	) => {

		// Skip if no time.
		if ( ms === 0 ) {
			return this;
		}

		// Skip if no time.
		if ( ! this.expiresAt ) {
			return this;
		}

		// Add time.
		this.startsAt  += ms;
		this.expiresAt += ms;

		// Return.
		return this;
	}
}
