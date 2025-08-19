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
 *
 * NO implicit global registration; caller must poll.
 *
 * Example:
 *   const t = new Timer().set(150);
 *   if ( t.done() ) { ... }
 *
 * Repeating example:
 *   tick() {
 *     if ( t.ping() ) spawn(); // ping() true exactly once per interval boundary
 *   }
 */
export default class Timer {

    /**
     * Timer constructor.
     */
    constructor() {
        this.reset();
    }

    /**
     * Internal reset (use clear() externally for semantics).
     *
     * @returns {Timer} this
     */
    reset = () => {

        // start timestamp
        this.s = 0;

        // duration ms
        this.d = 0;

        // expiry timestamp
        this.t = 0;

        // remaining ms when paused
        this.rem = 0;
        this.paused = false;

        // repeat interval ms
        this.interval = 0;

        return this;
    }

    /**
     * Begin / restart with duration.
     *
     * @param {Number} ms Duration in ms (<=0 clears).
     * @returns {Timer} this
     */
    set = (
        ms = 0
    ) => {

        // Clear if negative.
        if ( ms <= 0 ) {
            return this.clear();
        }

        this.s      = Time.now;
        this.d      = ms;
        this.t      = this.s + ms;
        this.rem    = 0;
        this.paused = false;

        return this;
    }

    /**
     * Alias for set().
     *
     * @param {Number} ms Duration ms.
     * @returns {Timer} this
     */
    start = ( ms ) => this.set( ms )

    /**
     * Clear / deactivate.
     *
     * @returns {Timer} this
     */
    clear = () => this.reset()

    /**
     * Alias for clear().
     *
     * @returns {Timer} this
     */
    stop = () => this.clear()

    /**
     * True while counting down.
     *
     * @returns {Boolean}
     */
    active = () => ( ! this.paused && this.t > 0 && Time.now < this.t )

    /**
     * True when expired (and not paused).
     *
     * @returns {Boolean}
     */
    done = () => ( ! this.paused && this.t > 0 && Time.now >= this.t )

    /**
     * Remaining milliseconds.
     *
     * @returns {Number}
     */
    left = () => ( this.active()
        ? ( this.t - Time.now )
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
        if ( ! this.t ) {
            return 0;
        }

        // Return
        if ( this.paused ) {
            return this.d - this.rem;
        }

        const e = Time.now - this.s;

        return ( e < 0 ? 0 : ( e > this.d ? this.d : e ) );
    }

    /**
     * Progress ratio 0..1.
     *
     * @returns {Number}
     */
    ratio = () => ( this.d > 0 ? ( this.elapsed() / this.d ) : 0 )

    /**
     * Pause (capture remaining).
     *
     * @returns {Timer} this
     */
    pause = () => {
        if ( ! this.paused && this.t > 0 ) {
            this.rem = this.t - Time.now;
            if ( this.rem < 0 ) this.rem = 0;
            this.paused = true;
        }
        return this;
    }

    /**
     * Resume (recompute expiry from remaining).
     *
     * @returns {Timer} this
     */
    resume = () => {
        if ( this.paused ) {
            if ( this.rem > 0 ) {
                this.s = Time.now - ( this.d - this.rem );
                this.t = Time.now + this.rem;
            } else {
                this.t = 0; this.d = 0;
            }
            this.rem = 0; this.paused = false;
        }
        return this;
    }

    /**
     * Set / update repeat interval (ms).
     *
     * @param   {Number} ms Interval in ms (0 disables).
     * @returns {Timer} this
     */
    repeat = ( ms = 0 ) => {
        this.interval = ms;
        if ( this.interval > 0 && this.done() ) {
            this.s = Time.now;
            this.d = this.interval;
            this.t = this.s + this.interval;
        }
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
        if ( this.interval > 0 && this.done() ) {
            this.s = Time.now;
            this.d = this.interval;
            this.t = this.s + this.interval;
            return true;
        }
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
            this.rem += ms;

        // Extend active timer.
        } else if ( this.active() ) {
            this.t += ms;
            this.d += ms;

        // Restart if done.
        } else if ( this.done() ) {
            this.set( ms );
        }

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

        if ( this.paused ) {
            this.rem = Math.max( 0, this.rem - ms );

        } else if ( this.active() ) {
            this.t -= ms;
            his.d = Math.max( 0, this.d - ms );

            if ( this.t <= Time.now ) {
                this.t = Time.now;
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
        if ( ! this.t ) {
            return this;
        }

        // Add time.
        this.s += ms;
        this.t += ms;

        // Return.
        return this;
    }
}
