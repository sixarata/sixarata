export default class Rain {

	/**
	 * Construct the Jobs utility.
	 */
	constructor() {
		this.set();
	}

	/**
	 * Set / initialize.
	 */
	set = () => {
		this.reset();
	}

	/**
	 * Reset internal state.
	 */
	reset = () => {

	}

	/**
	 * Register hooks with global Hooks system.
	 */
	hooks = () => {
		Game.Hooks.add( 'Frame.tick', this.tick, 9 );
	}

	/**
	 * Tick event handler.
	 */
	tick = () => {

	}

	/**
	 * Render event handler.
	 */
	render = () => {

	}
}