import Game from '../game.js';
import Settings from '../../content/settings.js';
import Time from '../utilities/time.js';

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
		size   = { w: 0.3, h: 0.3, d: 0.3 },
		type   = 'direct'
	) {

		// Reposition & rescale so super() works correctly.
		let sizeo  = new Size( size.w, size.h, size.d, 'up' ),
			source = Game.View.center(
				tile.physics.position,
				tile.physics.size,
				sizeo,
				false
			),

			// Start position.
			start = new Position(
				source.x,
				source.y,
				source.z,
				false
			),

			// Recolor based on type.
			color = ( 'follow' === type )
				? 'Pink'
				: 'White';

		// Parent.
		super( group, start, size, color, type, false );

		// Initialize.
		return this.set( tile, target );
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

		// Return.
		return this;
	}

	/**
	 * Tick through time.
	 */
	tick = () => {

		// Heat seeking so reset.
		if ( 'follow' === this.type ) {
			this.setTrajectory();
		}

		const scale = Time.scale;

		// Bump position.
		this.physics.position.x += ( this.sin * scale );
		this.physics.position.y += ( this.cos * scale );
		this.physics.position.z += ( this.cos * scale );
	}

	/**
	 * Set the trajectory of the Projectile.
	 */
	setTrajectory = () => {

		// Target.
		this.bullseye = Game.View.center(
			this.target.physics.position,
			this.target.physics.size,
			this.physics.size,
			false
		);

		// Goal position.
		this.end = new Position(
			this.bullseye.x,
			this.bullseye.y,
			this.bullseye.z,
			false
		);

		// Angle.
		this.angle = Math.atan2(
			( this.end.x - this.physics.position.x ),
			( this.end.y - this.physics.position.y ),
			//( this.end.z - this.physics.position.z ),
		);

		// Trajectory.
		this.sin = Math.sin( this.angle ) * this.speed;
		this.cos = Math.cos( this.angle ) * this.speed;
	}
}
