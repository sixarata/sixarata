import Game from '../game.js';

/**
 * The Input object.
 *
 * This object is responsible for mapping User input into actionable output.
 */
export default class Input {

	/**
	 * Which keys are currently pressed down.
	 *
	 * @var {Array} Default empty.
	 */
	keysDown = [];

	/**
	 * Which keys were previously pressed down.
	 *
	 * @var {Array} Default empty.
	 */
	keysPrev = [];

	/**
	 * The maximum number of ticks to store.
	 *
	 * @var {Number} Default 10.
	 */
	maxTicks = 10;

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
		this.keysPrev = [];
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
		this.keysPrev[ now ] = this.keysDown;

		// Trim off keys older than the max.
		if ( this.keysPrev.length >= this.maxTicks ) {
			this.keysPrev.shift;
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
	 * @param {Event} e The event.
	 */
	keyDown = (
		e = {}
	) => {

		// Skip if no key.
		if ( ! this.valid( e.key ) ) {
			return;
		}

		// Keep count.
		this.keysDown[ e.key ] = this.keysPrev[ e.key ]
			? this.keysPrev[ e.key ] + 1
			: 1;

		// Hook
		Game.Hooks.do( 'Input.keyDown', this.keysDown, e );
	}

	/**
	 * Callback for "keyup" event.
	 *
	 * @param {Event} e
	 */
	keyUp = (
		e = {}
	) => {

		// Skip if invalid.
		if ( ! this.valid( e.key ) ) {
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
	 * Callback for "keypress" event.
	 *
	 * @param {Event} e
	 */
	keyPressed = (
		e = {}
	) => {

		// Skip if invalid.
		if ( ! this.valid( e.key ) ) {
			return;
		}

		// Hook.
		Game.Hooks.do( 'Input.keyPressed', this.keysDown, e );
	}

	/**
	 * Return whether a key is valid.
	 *
	 * @param   {Event}   e
	 * @returns {Boolean} True if valid.
	 */
	valid = (
		e = {}
	) => {

		// Skip if no key.
		if ( ! e.key ) {
			return false;
		}

		// Letters and numbers only, for now.
		if ( e.key.match( /[^a-zA-Z0-9]/ ) ) {
			return true;
		}

		// Skip if not a letter or number.
		return false;
	}

	/**
	 * Return whether a key is pressed.
	 *
	 * @param   {String} keycode
	 * @returns {Mixed}  True if pressed.
	 */
	pressed = (
		keycode = ''
	) => {

		// Hook.
		return Game.Hooks.do( 'Input.pressed', this.keysDown[ keycode ] );
	}

	/**
	 * Return whether a key is released.
	 *
	 * @param   {String} keycode
	 * @returns {Mixed}  True if released.
	 */
	released = (
		keycode = ''
	) => {

		// Hook.
		return Game.Hooks.do( 'Input.released', this.keysDown[ keycode ] );
	}

	/**
	 * Return whether a key is held.
	 *
	 * @param   {String} keycode
	 * @returns {Mixed}  True if held.
	 */
	held = (
		keycode = ''
	) => {

		// Hook.
		return Game.Hooks.do( 'Input.held', this.keysDown[ keycode ] );
	}

	/**
	 * Return whether a key is tapped.
	 *
	 * @param   {String} keycode
	 * @returns {Mixed}  True if tapped.
	 */
	tapped = (
		keycode = ''
	) => {

		// Hook.
		return Game.Hooks.do( 'Input.tapped', this.keysDown[ keycode ] );
	}

	/**
	 * Return whether a key is double-tapped.
	 *
	 * @param   {String} keycode
	 * @returns {Mixed}  True if double-tapped.
	 */
	doubleTapped = (
		keycode = ''
	) => {

		// Hook.
		return Game.Hooks.do( 'Input.doubleTapped', this.keysDown[ keycode ] );
	}

	/**
	 * Return whether a key is triple-tapped.
	 *
	 * @param   {String} keycode
	 * @returns {Mixed}  True if triple-tapped.
	 */
	tripleTapped = (
		keycode = ''
	) => {

		// Hook.
		return Game.Hooks.do( 'Input.tripleTapped', this.keysDown[ keycode ] );
	}

	/**
	 * Return whether a key is quadruple-tapped.
	 *
	 * @param   {String} keycode
	 * @returns {Mixed}  True if quadruple-tapped.
	 */
	quadrupleTapped = (
		keycode = ''
	) => {

		// Hook.
		return Game.Hooks.do( 'Input.quadrupleTapped', this.keysDown[ keycode ] );
	}

	/**
	 * Return whether a key is quintuple-tapped.
	 *
	 * @param   {String} keycode
	 * @returns {Mixed}  True if quintuple-tapped.
	 */
	quintupleTapped = (
		keycode = ''
	) => {

		// Hook.
		return Game.Hooks.do( 'Input.quintupleTapped', this.keysDown[ keycode ] );
	}
}
