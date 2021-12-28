import Settings from '../settings.js';
import Game     from '../game.js';

import { Tile, Projectile } from './exports.js';

/**
 * The Enemy class.
 *
 * This class is responsible for everything that Enemies do.
 */
export default class Enemy extends Tile {

	constructor( group = [], position = { x: 0, y: 0 }, size = { w: 1, h: 1 } ) {
		super( group, position, size, 'Red' );

		this.reset();
	}

	reset = () => {
		this.shootOffScreen = true;
		this.shootCount = 0;
	}

	update = () => {
		this.shootCount = this.shootCount + Game.Frames.compensate( 1 );

		if ( Settings.enemies.maxShots < this.shootCount ) {

			let group  = Game.Room.tiles.projectiles,
				target = Game.Room.tiles.players[ 0 ];

			if ( this.canShoot() ) {
				new Projectile( group, this, target );

				this.shootCount = 0;
			}
		}
	}

	canShoot = () => {
		let camera = Game.Camera,
			view   = Game.View,
			pos    = ( this.position.x - camera.position.x );

		return (
			this.shootOffScreen
			||
			( 0 <= pos )
			&&
			( pos <= view.size.w )
		);
	}
}
