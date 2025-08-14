/* global performance */
/**
 * Time utility (singleton instance exported).
 *
 * Provides a monotonic high‑resolution timestamp (now) updated once per rAF
 * by Frame.animate, so all systems share an identical per‑frame time.
 */
class Time {

	constructor() {
		this.set();
	}

	set = () => {
		this.reset();
	}

	reset = () => {
		// Monotonic timestamps / frame metrics.
		const t = performance.now();
		this.now   = t;
		this.prev  = t;
		this.delta = 0; // ms
		this.diff  = 1; // normalized frame diff
		this.scale = 1; // movement scale
	}

	/**
	 * Update the cached time (called by Frame.animate).
	 */
	update = ( value = performance.now() ) => {
		this.prev  = this.now;
		this.now   = value;
		this.delta = ( this.now - this.prev );
	}

	/**
	 * Get a wall‑clock epoch ms if ever needed.
	 */
	epoch = () => {
		return Date.now();
	}
}

export default new Time();
