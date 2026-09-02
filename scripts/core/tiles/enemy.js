import Game from '../game.js';
import Settings from '../../content/settings.js';
import Time from '../utilities/time.js';

import Tile from './tile.js';
import Projectile from './projectile.js';

/**
 * The Enemy class.
 *
 * This class is responsible for everything that Enemies do.
 */
export default class Enemy extends Tile {

	constructor(
		group    = [],
		position = { x: 0, y: 0, z: 0 },
		size     = { w: 1, h: 1, d: 1 }
	) {
		super( group, position, size, 'Red' );

		return this.set();
	}

	/**
	 * Set the Enemy.
	 *
	 * @returns {Enemy}
	 */
	set = () => {
		return this.reset();
	}

	/**
	 * Reset the Enemy.
	 *
	 * @returns {Enemy}
	 */
	reset = () => {
		this.shootOffScreen = true;
		this.shootElapsed = 0;

		return this;
	}

	update = () => {
		this.shootElapsed += Time.seconds();

		if ( Settings.enemies.shotInterval < this.shootElapsed ) {

			let group  = Game.Room.tiles.projectiles,
				target = Game.Room.tiles.players[ 0 ];

			if ( this.canShoot() ) {
				new Projectile( group, this, target );

				this.shootElapsed = 0;
			}
		}
	}

	canShoot = () => {
		let camera = Game.Camera,
			view   = Game.View.buffer,
			pos    = ( this.physics.position.x - camera.position.x );

		return (
			this.shootOffScreen
			||
			( 0 <= pos )
			&&
			( pos <= view.size.w )
		);
	}
}
