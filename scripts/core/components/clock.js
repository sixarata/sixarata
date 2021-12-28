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
		this.times  = {
			start:   new Date(),
			current: new Date(),
			elapsed: 0,
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
	 * Return the elapsed time, formatted to 000.000.
	 *
	 * @returns String
	 */
	elapsed = () => {

		// Timer.
		let elapsed = this.times.elapsed.toString(),
			format  = '000.000',
			trim    = Math.max( elapsed.length - 3, 0 ),
			ms      = elapsed.slice( -3 ),
			s       = elapsed.slice( 0, trim ),
			f       = s + '.' + ms;

		// Return formatted time.
		return f.padStart( 7, format );
	}
}
