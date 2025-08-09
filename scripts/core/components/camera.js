import Game from '../game.js';

import { Position } from '../physics/exports.js';

/**
 * The Camera object.
 *
 * This object is responsible for holding the position of the primary view
 * of the player. All coordinates ultimately are influenced by it.
 */
export default class Camera {

	/**
	 * Construct the object.
	 */
	constructor() {
		this.set();
	}

	/**
	 * Set the Camera.
	 */
	set = () => {
		this.reset();
	}

	/**
	 * Reset the Camera.
	 */
	reset = () => {

	}

	/**
	 * Early events.
	 */
	hooks = () => {
		this.position = new Position( 0, 0, 0, false );

		// View.
		Game.Hooks.add( 'View.tick',     this.tick,   11 );
		Game.Hooks.add( 'View.update',   this.update, 8  );

		// Self.
		Game.Hooks.add( 'Camera.update', this.center );
		Game.Hooks.add( 'Camera.update', this.limit  );
	}

	/**
	 * Called at the end of View.tick().
	 *
	 * @todo Move out of tick to someplace that runs once.
	 */
	tick = () => {

		// Set vars for reuse below.
		this.view   = Game.View.buffer;
		this.room   = Game.Room;

		// Multiplayer?
		this.target = this.room.tiles.players[ 0 ];
	}

	/**
	 * Called at the end of View.update().
	 */
	update = () => {
		Game.Hooks.do( 'Camera.update' );
	}

	/**
	 * Center the camera on a specific target.
	 *
	 * By default, the target is the first player in the players array
	 * of the primary view.
	 */
	center = () => {

		// Skip if missing target or view.
		if ( ! this.target || ! this.view ) {
			return;
		}

		// Skip if not a number.
		if ( isNaN( this.target.physics.position.y ) ) {
			return;
		}

		// Reposition to center.
		this.position = Game.View.center(
			this.target.physics.position,
			this.target.physics.size,
			this.view.size,
			false
		);
	}

	/**
	 * Prevent the camera from centering when the target is close enough to
	 * the edge of the room for this to not make sense.
	 */
	limit = () => {

		// Skip if missing target or view.
		if ( ! this.target || ! this.view ) {
			return;
		}

		// No negative X.
		if ( this.position.x < 0 ) {
			this.position.x = 0;
		}

		// No overscroll X.
		if ( this.position.x > Math.round( this.room.size.w - this.view.size.w ) ) {
			this.position.x = Math.round( this.room.size.w - this.view.size.w );
		}

		// No negative Y.
		if ( this.position.y < 0 ) {
			this.position.y = 0;
		}

		// No overscroll Y.
		if ( this.position.y > Math.round( this.room.size.h - this.view.size.h ) ) {
			this.position.y = Math.round( this.room.size.h - this.view.size.h );
		}
	}
}
