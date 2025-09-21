/* global performance */
/**
 * Time utility (singleton instance exported).
 *
 * Provides a monotonic high‑resolution timestamp (now) updated once per rAF
 * by Frame.animate, so all systems share an identical per‑frame time.
 */
class Time {

	/**
	 * Time constructor.
	 *
	 * @returns {Time} this
	 */
	constructor() {
		return this.set();
	}

	/**
	 * Set the time metrics.
	 *
	 * @returns {Time} this
	 */
	set = () => {
		return this.reset();
	}

	/**
	 * Reset the time metrics.
	 *
	 * @returns {Time} this
	 */
	reset = () => {

		// Fetch current time.
		const t = performance.now();

		// Initialize.
		this.now   = t;
		this.prev  = t;
		this.delta = 0;
		this.diff  = 1;
		this.scale = 1;

		// Return.
		return this;
	}

	/**
	 * Update the cached time (called by Frame.animate).
	 *
	 * @param {Number} value Optional time value (performance.now()).
	 * @return {Time} this
	 */
	update = (
		value = performance.now()
	) => {

		// Update metrics.
		this.prev  = this.now;
		this.now   = value;
		this.delta = ( this.now - this.prev );

		// Return.
		return this;
	}

	/**
	 * Get a wall‑clock epoch ms if ever needed.
	 *
	 * @returns {Number} Epoch ms.
	 */
	epoch = () => {
		return Date.now();
	}
}

export default new Time();
