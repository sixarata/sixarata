import Game from '../game.js';

/**
 * The Clock object.
 *
 * This object is responsible for keeping & displaying the game time.
 */
export default class Clock {

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
	 * Reset the Clock.
	 */
	reset = () => {

		// Get the current time.
		const now = new Date();

		// Set the times.
		this.times = {
			start:   now,
			current: now,
			elapsed: 0
		};
	}

	/**
	 * Early events.
	 */
	hooks = () => {
		Game.Hooks.add( 'Frames.tick', this.tick );
	}

	/**
	 * Tick through time.
	 */
	tick = () => {
		this.times.current = new Date();
		this.times.elapsed = ( this.times.current - this.times.start );
	}

	/**
	 * Return the elapsed time.
	 *
	 * @param   {String} format     Default '000.000'.
	 * @param   {String} delineator Default '.'.
	 * @returns {String}
	 */
	elapsed = (
		format     = '000.000',
		delineator = '.'
	) => {

		// Parse the format by the delineator.
		const
			elapsed = this.times.elapsed.toString(),
			pos     = format.indexOf( delineator ),
			trim    = Math.max( elapsed.length - pos, 0 ),
			ms      = elapsed.slice( -pos ),
			s       = elapsed.slice( 0, trim ),
			f       = s + delineator + ms,
			ret     = f.padStart( format.length, format );

		// Return formatted time.
		return ret;
	}
}
