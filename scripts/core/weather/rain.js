import Game from '../game.js';

/**
 * Rain weather effect lifecycle.
 *
 * The effect is intentionally visual-state neutral until particle rendering
 * is implemented, while still exposing the standard engine lifecycle.
 */
export default class Rain {

	/**
	 * Construct the rain effect.
	 *
	 * @returns {Rain} this
	 */
	constructor() {
		return this.set();
	}

	/**
	 * Set / initialize.
	 *
	 * @returns {Rain} this
	 */
	set = () => {
		return this.reset();
	}

	/**
	 * Reset internal state.
	 *
	 * @returns {Rain} this
	 */
	reset = () => {
		return this;
	}

	/**
	 * Register hooks with global Hooks system.
	 *
	 * @returns {void}
	 */
	hooks = () => {
		Game.Hooks.add( 'Frame.tick', this.tick, 9 );
	}

	/**
	 * Tick event handler.
	 *
	 * @returns {void}
	 */
	tick = () => {

	}

	/**
	 * Render event handler.
	 *
	 * @returns {void}
	 */
	render = () => {

	}
}
