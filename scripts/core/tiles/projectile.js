import Settings from '../settings.js';
import Game     from '../game.js';

import { Tile } from './exports.js';
import { Size, Position } from '../physics/exports.js';

/**
 * The Projectile object.
 *
 * An extension of the Tile object, a Projectile is shot from something,
 * typically an Enemy object, but could be anything.
 */
export default class Projectile extends Tile {

	/**
	 * Construct the object.
	 *
	 * @param {array}  group
	 * @param {Tile}   tile
	 * @param {Tile}   target
	 * @param {Size}   size
	 * @param {String} type
	 */
	constructor(
		group  = [],
		tile   = {},
		target = {},
		size   = { w: 0.3, h: 0.3, d: 0 },
		type   = 'direct'
	) {

		// Reposition & rescale so super() works correctly.
		let sizeo  = new Size( size.w, size.h, 'up' ),
			source = Game.View.center(
				tile.position,
				tile.size,
				sizeo
			),

			// Start position.
			start = new Position(
				source.x,
				source.y,
				source.z,
				'down'
			),

			// Recolor based on type.
			color = ( 'follow' === type )
				? 'Pink'
				: 'White';

		// Parent.
		super( group, start, size, color, type, false );

		// Initialize.
		this.set( tile, target );
	}

	/**
	 * Set the object.
	 *
	 * @param {Tile} tile
	 * @param {Tile} target
	 */
	set = ( tile, target ) => {
		this.tile   = tile;
		this.target = target;
		this.speed  = Settings.projectiles.speed;

		// Trajectory.
		this.setTrajectory();
	}

	/**
	 * Tick through time.
	 */
	tick = () => {

		// Heat seeking so reset.
		if ( 'follow' === this.type ) {
			this.setTrajectory();
		}

		const comp = Game.Frames.compensate;

		// Bump position.
		this.position.x = ( this.position.x + comp( this.sin ) );
		this.position.y = ( this.position.y + comp( this.cos ) );
	}

	/**
	 * Set the trajectory of the Projectile.
	 */
	setTrajectory = () => {

		// Target.
		this.bullseye = Game.View.center( this.target.position, this.target.size, this.size );
		this.end      = new Position(
			this.bullseye.x,
			this.bullseye.y,
			this.bullseye.z,
			'down'
		);

		// Angle.
		this.angle = Math.atan2(
			( this.end.x - this.position.x ),
			( this.end.y - this.position.y ),
		);

		// Trajectory.
		this.sin = Math.sin( this.angle ) * this.speed;
		this.cos = Math.cos( this.angle ) * this.speed;
	}
}
