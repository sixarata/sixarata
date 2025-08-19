import { Gamepad, Keyboard } from '../inputs/exports.js';
import Game from '../game.js';

/**
 * Inputs manager.
 *
 * Manages multiple input devices (keyboard, gamepad, etc) and provides
 * a unified interface for polling, action checks, and axes queries.
 */
export default class Inputs {

	/**
	 * Construct the Inputs manager.
	 *
	 * Initializes and stores all input device instances.
	 */
	constructor() {
		this.set();
	}

	/**
	 * Set the Inputs manager.
	 *
	 * Initializes all input devices.
	 */
	set = () => {
		this.reset();
	}

	/**
	 * Reset the Inputs manager.
	 *
	 * Clears all input device state.
	 */
	reset = () => {
		this.devices = [
			new Gamepad(),
			new Keyboard(),
		];
	}

	/**
	 * Register polling with the game loop.
	 *
	 * Adds the tick method to the Frame.tick hook for regular polling.
	 */
	hooks = () => {
		Game.Hooks.add( 'Frame.tick', this.tick );
	}

	/**
	 * Poll all input devices.
	 *
	 * Calls tick() on each device to update their state.
	 */
	tick = () => {
		this.devices.forEach(
			d => d.tick()
		);
	}

	/**
	 * Check if a logical action is pressed on any device.
	 *
	 * @param {String} action - The action name (e.g. 'left', 'jump').
	 * @returns {Boolean} True if the action is pressed on any device.
	 */
	pressed = (
		action = ''
	) => {
		return this.devices.some(
			d => d.pressed( action )
		);
	}

	/**
	 * Get axes values from the first device reporting non-zero axes.
	 *
	 * @returns {Array} Array of axis values [x, y].
	 */
	axes = () => {
		for ( const d of this.devices ) {
			const axes = d.axes();

			// Check if axes are valid
			if ( axes && ( axes[ 0 ] !== 0 || axes[ 1 ] !== 0 ) ) {
				return axes;
			}
		}

		// Default if no device has axes
		return [
			0,
			0
		];
	}
}
