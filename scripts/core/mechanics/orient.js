import Game from '../game.js';

/**
 * The Orient mechanic.
 *
 * This mechanic updates a tile's orientation based on directional input.
 * (Currently only horizontal facing: 90 right, 270 left; Y reset to 0.)
 */
export default class Orient {

	/**
	 * Construct the Orient mechanic.
	 *
	 * @param {Tile} tile A Tile with an `orientation` property.
	 */
	constructor(
		tile = null
	) {
		this.set( tile );
	}

	/**
	 * Set the mechanic.
	 *
	 * @param {Tile} tile A Tile with an `orientation` property.
	 */
	set = (
		tile = null
	) => {
		this.reset();
		this.tile = tile;
	}

	/**
	 * Reset the mechanic.
	 */
	reset = () => {
		this.tile      = null;
		this.listening = true;
	}

	/**
	 * Listen for directional inputs and update orientation.
	 */
	listen = () => {

		// Skip if not listening.
		if ( ! this.listening ) {
			return;
		}

		// Skip if no tile.
		if ( ! this.tile ) {
			return;
		}

		const orientation = this.tile.physics?.orientation;

		// Right.
		if ( Game.Inputs.pressed( 'right' ) ) {
			orientation.x = 90;
		}

		// Left.
		if ( Game.Inputs.pressed( 'left' ) ) {
			orientation.x = 270;
		}

		// Always reset Y to 0 for now.
		orientation.y = 0;
	}
}
