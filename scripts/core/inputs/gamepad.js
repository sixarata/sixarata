import Device from './device.js';

/**
 * Gamepad input handler.
 *
 * This class wraps the JavaScript Gamepad API and exposes a consistent interface
 * for polling gamepad state, checking button presses, and reading axes.
 * Extends the Device base class for unified input management.
 */
export default class Gamepad extends Device {

	/**
	 * Default input mappings.
	 *
	 * These are the default inputs used for each action.
	 *
	 * @type {Object}
	 */
	static defaults = {

		// Movement (Left Stick + D-Pad)
		left: [
			{ type: 'axes',   idx: 0, dir: -1 },
			{ type: 'button', idx: 14 }
		],
		right: [
			{ type: 'axes',   idx: 0, dir:  1 },
			{ type: 'button', idx: 15 }
		],
		up: [
			{ type: 'axes',   idx: 1, dir: -1 },
			{ type: 'button', idx: 12 }
		],
		down: [
			{ type: 'axes',   idx: 1, dir:  1 },
			{ type: 'button', idx: 13 }
		],

		// Game
		pause: [
			{ type: 'button', idx: 9 }
		],
		enter: [
			{ type: 'button', idx: 9 }
		],

		// Actions
		jump: [
			{ type: 'button', idx: 0 }
		],
		attack: [
			{ type: 'button', idx: 2 }
		],
		secondary: [
			{ type: 'button', idx: 3 }
		],
		roll: [
			{ type: 'button', idx: 1 }
		],
		interact: [
			{ type: 'button', idx: 5 }
		],
		skill1: [
			{ type: 'button', idx: 4 }
		],
		skill2: [
			{ type: 'button', idx: 7 }
		],
	};

	/**
	 * Construct the Gamepad.
	 *
	 * Initializes state and sets up event listeners for gamepad connections.
	 */
	constructor() {
		super();
		this.set();
		this.listen();
	}

	/**
	 * Set the Gamepad.
	 *
	 * Resets state and attaches event listeners.
	 */
	set = () => {
		return this.reset();
	}

	/**
	 * Reset the Gamepad.
	 *
	 * Clears all gamepad state, previous state, and connection status.
	 */
	reset = () => {
		this.gamepads = [];
		this.state = {};
		this.prev = {};

		// Return.
		return this;
	}

	/**
	 * Get the current gamepads.
	 *
	 * @returns {Array} An array of connected gamepads.
	 */
	pads = () => {
		return navigator.getGamepads()
			? navigator.getGamepads()
			: [];
	}

	/**
	 * Add the Listeners.
	 *
	 * Attaches event listeners for gamepad connection and disconnection.
	 */
	listen = () => {

		// Listen for gamepad connections.
		addEventListener(
			'gamepadconnected',
			this.connect,
			false
		);

		// Listen for gamepad disconnections.
		addEventListener(
			'gamepaddisconnected',
			this.disconnect,
			false
		);
	}

	/**
	 * Handle gamepad connection.
	 *
	 * @param {Object} e - The event object.
	 *
	 * Sets the connected flag, stores the gamepad, and triggers a hook.
	 */
	connect = (
		e = {}
	) => {
		this.connected = true;
		this.gamepads[ e.gamepad.index ] = e.gamepad;
	}

	/**
	 * Handle gamepad disconnection.
	 *
	 * @param {Object} e - The event object.
	 *
	 * Clears the connected flag, removes the gamepad, and triggers a hook.
	 */
	disconnect = (
		e = {}
	) => {
		this.connected = false;
		delete this.gamepads[ e.gamepad.index ];
	}

	/**
	 * Update gamepad state.
	 *
	 * Reads all connected gamepads and updates the state object.
	 */
	tick = () => {
		const pads = this.pads();

		// Copy previous state.
		this.prev  = this.state;
		this.state = {};

		for ( let i = 0; i < pads.length; i++ ) {
			const pad = pads[ i ];

			// Skip if no pad is found
			if ( ! pad ) {
				continue;
			}

			// Map the gamepad state to the gamepad state
			this.state[ pad.index ] = {
				id: pad.id,
				axes: [...pad.axes],
				buttons: pad.buttons.map( b => b.pressed ),
			};
		}
	}

	/**
	 * Check if an action is pressed.
	 *
	 * Supports both axes (analog sticks) and D-pad buttons for directions.
	 *
	 * @param {String} action - The action name (e.g. 'left', 'right', 'up', 'down', 'jump').
	 * @returns {Boolean} True if the action is pressed on any connected gamepad.
	 */
	pressed = (
		action = ''
	) => {

		// Map actions to standard gamepad buttons/axes
		const map = this.actions();

		// Get the checks for the action
		const checks = map[ action ];

		// Skip if no mapping found
		if ( ! checks ) {
			return false;
		}

		// Check all connected pads for the action
		for ( const padIndex in this.state ) {
			const pad = this.state[ padIndex ];

			// Skip if no pad is found
			if ( ! pad ) {
				continue;
			}

			// Check buttons and axes
			for ( const check of checks ) {

				// Check buttons
				if (
					check.type === 'button'
					&&
					pad.buttons[ check.idx ]
				) {
					return true;
				}

				// Check axes
				if ( check.type === 'axes' ) {

					// Check negative direction
					if (
						check.dir < 0
						&&
						pad.axes[ check.idx ] < -0.5
					) {
						return true;
					}

					// Check positive direction
					if (
						check.dir > 0
						&&
						pad.axes[ check.idx ] >  0.5
					) {
						return true;
					}
				}
			}
		}

		// No input detected
		return false;
	}

	/**
	 * Get axes values for the first connected gamepad.
	 *
	 * @returns {Array} Array of axis values [x, y].
	 */
	axes = () => {
		const pad = this.state[ 0 ];

		return pad
			? [ pad.axes[ 0 ] || 0, pad.axes[ 1 ] || 0 ]
			: [ 0, 0 ];
	}

	/**
	 * Log only the changes between previous and current gamepad state.
	 *
	 * Compares this.prev and this.state and logs only the differences.
	 */
	log = () => {
		for ( const idx in this.state ) {
			const prevPad = this.prev[ idx ] || {},
				  currPad = this.state[ idx ];

			// Compare axes
			if ( prevPad.axes && currPad.axes ) {
				currPad.axes.forEach( ( val, axisIdx ) => {
					if ( val !== prevPad.axes[ axisIdx ] ) {
						console.log(
							`Gamepad[ ${idx} ] axis ${axisIdx} changed: ${prevPad.axes[ axisIdx ]} → ${val}`
						);
					}
				} );
			}

			// Compare buttons
			if ( prevPad.buttons && currPad.buttons ) {
				currPad.buttons.forEach( ( pressed, btnIdx ) => {
					if ( pressed !== prevPad.buttons[ btnIdx ] ) {
						console.log( `Gamepad[ ${idx} ] button ${btnIdx} ${pressed
							? 'pressed'
							: 'released'}`
						);
					}
				} );
			}
		}
	}
}