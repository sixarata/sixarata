import Device from './device.js';
import Game from '../game.js';

/**
 * Keyboard input handler.
 *
 * Handles keyboard events and exposes a consistent interface for polling
 * key state, checking logical actions, and reading axes. Extends the Device
 * base class for unified input management.
 */
export default class Keyboard extends Device {

	/**
	 * Default key mappings.
	 *
	 * These are the default keys used for each action.
	 *
	 * @type {Object}
	 */
	static defaults = {
		left:  [ 'ArrowLeft', 'KeyA' ],
		right: [ 'ArrowRight', 'KeyD' ],
		up:	   [ 'ArrowUp', 'KeyW' ],
		down:  [ 'ArrowDown', 'KeyS' ],
		jump:  [ 'Space', 'KeyZ' ],
		pause: [ 'Escape' ],
		enter: [ 'Enter' ],
	};

	/**
	 * Construct the Keyboard input handler.
	 *
	 * Initializes key state and attaches event listeners.
	 */
	constructor() {
		super();
		this.set();
		this.listen();
	}

	/**
	 * Set the Keyboard.
	 *
	 * Resets state and attaches event listeners.
	 */
	set = () => {
		this.reset();
	}

	/**
	 * Reset the Keyboard.
	 *
	 * Clears all key state.
	 */
	reset = () => {

		// Keys
		this.keys = {};

		// Mapping
		this.map = this.actions();
	}

	/**
	 * Tick through time.
	 */
	tick = () => {

	}

	/**
	 * Attach keyboard event listeners.
	 *
	 * Listens for keydown and keyup events to update key state.
	 */
	listen = () => {
		addEventListener( 'keydown',  this.keyDown.bind( this ), false );
		addEventListener( 'keyup', this.keyUp.bind( this ), false );
		addEventListener( 'keypress', this.keyPressed.bind( this ), false );
	}

	/**
	 * Callback for "keydown" event.
	 *
	 * @param {Event} e The event.
	 */
	keyDown = (
		e = {}
	) => {

		// Skip if not a valid key.
		if ( ! this.valid( e ) ) {
			return;
		}

		this.keys[ e.code ] = true;
	}

	/**
	 * Callback for "keyup" event.
	 *
	 * @param {Event} e The event.
	 */
	keyUp = (
		e = {}
	) => {

		// Skip if not a valid key.
		if ( ! this.valid( e ) ) {
			return;
		}

		this.keys[ e.code ] = false;
	}

	/**
	 * Callback for "keypress" event.
	 *
	 * @param {Event} e The event.
	 */
	keyPressed = (
		e = {}
	) => {

		// Skip if not a valid key.
		if ( ! this.valid( e ) ) {
			return;
		}
	}

	/**
	 * Return whether a key event is valid.
	 *
	 * @param   {Event}   e
	 * @returns {Boolean} True if valid.
	 */
	valid = (
		e = {}
	) => {
		return !!e.code;
	}

	/**
	 * Check if a logical action is pressed.
	 *
	 * @param {String} action - The action name (e.g. 'left', 'jump').
	 * @returns {Boolean} True if the action is pressed.
	 */
	pressed = (
		action = ''
	) => {
		return ( this.map[ action ] || [] ).some(
			code => this.keys[ code ]
		);
	}

	/**
	 * Get axes values based on key state.
	 *
	 * @returns {Array} Array of axis values [x, y].
	 */
	axes = () => {

		// Defaults.
		let x = 0,
			y = 0;

		// Left.
		if ( this.pressed( 'left' ) ) {
			x -= 1;
		}

		// Right.
		if ( this.pressed( 'right' ) ) {
			x += 1;
		}

		// Up.
		if ( this.pressed( 'up' ) ) {
			y -= 1;
		}

		// Down
		if ( this.pressed( 'down' ) ) {
			y += 1;
		}

		// Return X & Y.
		return [
			x,
			y,
		];
	}
}
