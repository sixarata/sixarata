import Game from '../game.js';

/**
 * The Input object.
 *
 * This object is responsible for mapping User input into actionable output.
 */
export default class Input {

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
		this.listen();
	}

	/**
	 * Reset the Input.
	 */
	reset = () => {
		this.keysDown = [];
		this.previous = [];
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

		// Get the Clock time.
		let now = Game.Clock.pnow;

		// Stash the previous keys.
		this.previous[ now ] = this.keysDown;

		// Trim off the oldest keys.
		if ( 10 >= this.previous.length ) {
			this.previous.shift;
		}
	}

	/**
	 * Add the Listeners.
	 */
	listen = () => {

		// Key down.
		addEventListener( 'keydown', this.keyDown.bind( this ), false );

		// Key up.
		addEventListener( 'keyup', this.keyUp.bind( this ), false );

		// Pressed.
		addEventListener( 'keypress', this.keyPressed.bind( this ), false );
	}

	/**
	 * Callback for "keydown" event.
	 *
	 * @param {keycode} e
	 */
	keyDown = ( e = {} ) => {

		// Skip if no key.
		if ( ! e.key ) {
			return;
		}

		// Keep count.
		this.keysDown[ e.key ] = this.previous[ e.key ]
			? this.previous[ e.key ] + 1
			: 1;

		// Hook
		Game.Hooks.do( 'Input.keyDown', this.keysDown, e );
	}

	/**
	 * Callback for "keyup" event.
	 *
	 * @param {keycode} e
	 */
	keyUp = ( e = {} ) => {

		// Skip if no key.
		if ( ! e.key ) {
			return;
		}

		// Let up.
		if ( this.keysDown[ e.key ] ) {
			this.keysDown[ e.key ] = false;
		}

		// Hook.
		Game.Hooks.do( 'Input.keyUp', this.keysDown, e );
	}

	/**
	 * Return whether a key is pressed.
	 *
	 * @param {keycode} e
	 * @returns {Mixed}
	 */
	keyPressed = ( e = {} ) => {

		// Skip if no key.
		if ( ! e.key ) {
			return;
		}

		// Hook.
		Game.Hooks.do( 'Input.keyPressed', this.keysDown, e );
	}

	/**
	 * Return whether a key is pressed.
	 *
	 * @param {String} keycode
	 * @returns {Mixed}
	 */
	pressed = ( keycode = '' ) => {

		// Hook.
		return Game.Hooks.do( 'Input.pressed', this.keysDown[ keycode ] );
	}
}
