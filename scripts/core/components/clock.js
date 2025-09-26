import Game from '../game.js';
import Time from '../utilities/time.js';

/**
 * The Clock object.
 *
 * This object is responsible for keeping & displaying the game time.
 */
export default class Clock {

	/**
	 * Construct the object.
	 *
	 * @returns {Clock} this
	 */
	constructor() {
		return this.set();
	}

	/**
	 * Set the object.
	 *
	 * @returns {Clock} this
	 */
	set = () => {
		return this.reset();
	}

	/**
	 * Reset the Clock.
	 *
	 * @returns {Clock} this
	 */
	reset = () => {

		// Seed from shared Time module.
		const now = Time.now;

		// Set the times.
		this.times = {
			start:   now,
			current: now,
			elapsed: 0,
		};

		// Return.
		return this;
	}

	/**
	 * Early events.
	 */
	hooks = () => {
		Game.Hooks.add( 'Frame.tick', this.tick );
	}

	/**
	 * Tick through time.
	 */
	tick = () => {
		this.times.current = Time.now;
		this.times.elapsed = ( this.times.current - this.times.start );
	}

	/**
	 * Return the elapsed time.
	 *
	 * @param   {String} format Token format like 'hh:mm:ss.SSS'.
	 * @returns {String}
	 */
	elapsed = (
		format = 'hh:mm:ss.SSS',
	) => {

		// Total elapsed milliseconds as integer (clamp to >= 0).
		const totalMs = Math.max( 0, Math.floor( this.times.elapsed ) );

		// Check for token-based formatting (true time units).
		const hasTokens = /h{1,2}|m{1,2}|s{1,2}|S{1,3}/.test( format );

		// Decompose total time to units.
		const hours = Math.floor( totalMs / 3600000 );
		const mins  = Math.floor( ( totalMs % 3600000 ) / 60000 );
		const secs  = Math.floor( ( totalMs % 60000 ) / 1000 );
		const ms    = totalMs % 1000;

		if ( hasTokens ) {

			// Helper padding.
			const p2 = ( n ) => String( n ).padStart( 2, '0' );
			const p3 = ( n ) => String( n ).padStart( 3, '0' );

			// Replace tokens. Process longer tokens first to avoid overlaps.
			let out = format;

			// Milliseconds: support S, SS, SSS (truncate to precision available)
			out = out.replace( /S{1,3}/g, ( m ) => p3( ms ).slice( 0, m.length ) );
			out = out.replace( /hh/g, p2( hours ) );
			out = out.replace( /mm/g, p2( mins ) );
			out = out.replace( /ss/g, p2( secs ) );

			// Optional single-letter tokens without padding.
			out = out.replace( /h(?!h)/g, String( hours ) );
			out = out.replace( /m(?!m)/g, String( mins ) );
			out = out.replace( /s(?!s)/g, String( secs ) );

			return out;
		}
	}
}
