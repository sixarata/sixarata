import Game from '../../game.js';

/**
 * The Decay mechanic.
 *
 * Applies passive frictional decay when no horizontal input is held and
 * snaps very small velocities to zero to prevent drift.
 */
export default class Decay {

	/**
	 * Construct the Decay mechanic.
	 *
	 * @param {Tile|null} tile A Tile with a physics.velocity object.
	 */
	constructor( tile = null ) {
		return this.set( tile );
	}

	/**
	 * Set the mechanic.
	 *
	 * @param {Tile|null} tile A Tile with a physics.velocity object.
	 */
	set = ( tile = null ) => {
		this.reset();
		this.tile = tile;
		return this;
	}

	/**
	 * Reset the mechanic.
	 */
	reset = () => {
		this.tile      = null;
		this.listening = true;

		return this;
	}


	/**
	 * Listen for idle decay.
	 */
	listen = () => {

		// Skip if disabled or unbound.
		if ( ! this.listening || ! this.tile ) {
			return;
		}

		const v = this.tile.physics?.velocity;
		if ( ! v ) {
			return;
		}

		const l = Game.History.hold( 'left' );
		const r = Game.History.hold( 'right' );

		if ( ! l?.down && ! r?.down ) {
			v.x *= Game.Friction.force;

			if ( Math.abs( v.x ) < Game.Friction.force ) {
				v.x = 0;
			}
		}
	}
}
