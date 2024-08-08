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
	 * @param   {String} format Default '000.000'.
	 * @returns {String}
	 */
	elapsed = (
		format = '000.000'
	) => {

		// Timer.
		let elapsed = this.times.elapsed.toString(),
			divider = format.indexOf( '.' ) ?? 3,
			trim    = Math.max( elapsed.length - divider, 0 ),
			ms      = elapsed.slice( -divider ),
			s       = elapsed.slice( 0, trim ),
			f       = s + '.' + ms;

		// Return formatted time.
		return f.padStart( format.length, format );
	}
}
