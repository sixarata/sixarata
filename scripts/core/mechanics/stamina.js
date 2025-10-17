import Timer from '../utilities/timer.js';
import Time from '../utilities/time.js';

/**
 * The Stamina mechanic.
 *
 * A generic, reusable stamina/resource management system that can be
 * instantiated for any mechanic that needs resource depletion/regeneration.
 *
 * Features:
 * - Time-based (not frame-based) for consistent behavior across frame rates
 * - Configurable max capacity (milliseconds)
 * - Drain rate (ms per ms) or instant costs
 * - Delayed regeneration with configurable rate
 * - Instant refill conditions (e.g., on ground)
 * - Percentage queries for UI/debugging
 *
 * Usage:
 * - Can be used per-mechanic (wall stamina, combat stamina)
 * - Can be shared across mechanics (global stamina pool)
 * - Configurable via settings or defaults
 *
 * All time values are in milliseconds:
 * - max: Total stamina capacity (e.g., 2000 = 2 seconds)
 * - drain: Depletion rate (e.g., 1 = drains at 1x realtime, 2 = drains 2x faster)
 * - delay: Cooldown before recharge starts (e.g., 500 = 0.5 seconds)
 * - rate: Recharge rate per millisecond (e.g., 2 = refills 2ms per 1ms)
 */
export default class Stamina {

	/**
	 * Default stamina settings.
	 *
	 * @type {Object}
	 */
	static defaults = {
		max:   1000,
		drain: 1,
		delay: 500,
		rate:  2,
	}

	/**
	 * Construct the Stamina mechanic.
	 *
	 * @param {Object|null} settings Optional settings to override defaults.
	 * @returns {Stamina} this
	 */
	constructor(
		settings = null
	) {
		return this.set( settings );
	}

	/**
	 * Set/configure the stamina mechanic.
	 *
	 * @param {Object|null} settings Settings object with max, drainRate, etc.
	 * @returns {Stamina} this
	 */
	set = (
		settings = null
	) => {
		this.reset( settings );

		// Return.
		return this;
	}

	/**
	 * Reset internal state with optional new settings.
	 *
	 * @param {Object|null} settings Optional settings to apply.
	 * @returns {Stamina} this
	 */
	reset = (
		settings = null
	) => {

		// Load settings (merge with defaults).
		this.settings = { ...Stamina.defaults, ...settings };

		// Current stamina (start at max).
		this.current = this.settings.max;

		// Recharge delay timer.
		this.recharge = new Timer();

		// Return.
		return this;
	}

	/**
	 * Primary loop hook - handles auto-recharge logic.
	 *
	 * Call this each frame to allow stamina to regenerate.
	 */
	listen = () => {

		// Only recharge if not at max.
		if ( this.current >= this.settings.max ) {
			return;
		}

		// Wait for recharge delay to pass.
		if ( ! this.recharge.done() ) {
			return;
		}

		// Gradually refill stamina based on time elapsed.
		this.current = Math.min(
			this.current + ( this.settings.rate * Time.delta ),
			this.settings.max
		);
	}

	/**
	 * Check if stamina is available.
	 *
	 * @param {Number} amount Optional minimum amount required (default: any).
	 * @returns {Boolean} True if current stamina >= amount.
	 */
	has = (
		amount = 0
	) => {
		return this.current > amount;
	}

	/**
	 * Drain stamina by a specified amount.
	 *
	 * If no amount is specified, drains based on time elapsed and drain rate.
	 * The drain rate acts as a multiplier: 1 = drains at realtime, 2 = drains 2x faster.
	 *
	 * @param {Number|null} amount Optional fixed amount to drain (ignores time/rate).
	 * @returns {Stamina} this
	 */
	drain = (
		amount = null
	) => {

		// If specific amount provided, drain that exact amount (instant cost).
		// Otherwise, drain based on time elapsed * drain rate.
		const drainAmount = amount ?? ( this.settings.drain * Time.delta );

		// Reduce current stamina (clamp to 0).
		this.current = Math.max( 0, this.current - drainAmount );

		// Start recharge delay timer.
		if ( this.settings.delay > 0 ) {
			this.recharge.set( this.settings.delay );
		}

		// Return.
		return this;
	}

	/**
	 * Instantly refill stamina to max.
	 *
	 * @returns {Stamina} this
	 */
	refill = () => {

		// Set to max.
		this.current = this.settings.max;

		// Clear recharge timer.
		this.recharge.clear();

		// Return.
		return this;
	}

	/**
	 * Get current stamina as a percentage (0-1).
	 *
	 * @returns {Number} Percentage from 0 to 1.
	 */
	percent = () => {

		// Avoid divide by zero.
		if ( this.settings.max <= 0 ) {
			return 1;
		}

		// Return percentage.
		return this.current / this.settings.max;
	}

	/**
	 * Check if stamina is depleted.
	 *
	 * @returns {Boolean} True if stamina is at 0.
	 */
	depleted = () => {
		return this.current <= 0;
	}

	/**
	 * Check if stamina is at max.
	 *
	 * @returns {Boolean} True if stamina is full.
	 */
	full = () => {
		return this.current >= this.settings.max;
	}
}
