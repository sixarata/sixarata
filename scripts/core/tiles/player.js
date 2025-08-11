import Game from '../game.js';
import Settings from '../../custom/settings.js';

import { Tile } from './exports.js';
import { Collision, Contact, Orientation, Position, Velocity } from '../physics/exports.js';
import { Collide, Coyote, Fall, Jump, Orient, Walk, WallJump } from '../mechanics/exports.js';

/**
 * The Player object.
 *
 * This object is responsible for everything related to a Player.
 */
export default class Player extends Tile {

	/**
	 * Construct the Player.
	 *
	 * @param {Array}    group
	 * @param {Position} position
	 * @param {Size}     size
	 */
	constructor(
		group    = [],
		position = { x: 0, y: 0, z: 0 },
		size     = { w: 1, h: 1, d: 1 }
	) {
		super( group, position, size, 'Yellow' );

		this.set();
	}

	/**
	 * Set the Player.
	 */
	set = () => {
		this.reset();
	}

	/**
	 * Reset the object.
	 */
	reset = () => {

		// Settings.
		this.retries = Settings.player.retries
		this.health  = Settings.player.health;

		// Physics
		this.physics.contact     = new Contact();
		this.physics.orientation = new Orientation( 90, 0 );
		this.physics.velocity    = new Velocity( 0, 0 );

		// Mechanics.
		this.mechanics = {
			collide: new Collide( this ),
			coyote:  new Coyote( this ),
			fall:    new Fall( this ),
			jump:    new Jump( this ),
			orient:  new Orient( this ),
			walk:    new Walk( this ),
			wall:    new WallJump( this ),
		};
	}

	/**
	 * Tick through time.
	 */
	tick = () => {

		// Checks.
		this.checks();

		// Resize.
		this.resize();

		// Reposition.
		this.reposition();

		// Change color.
		this.recolor();

		// User input.
		this.respond();
	}

	/**
	 * Check if the Player has moved at all.
	 *
	 * @returns {Boolean}
	 */
	moved = () => {
		return (
			Object.getOwnPropertyNames( Game.Inputs.keysDown ).length > 0
		);
	}

	/**
	 * Check if the Player has fallen to the bottom of the Room.
	 *
	 * @returns {Boolean}
	 */
	fell = () => {
		return ( this.physics.position.y > Game.Room.size.h );
	}

	/**
	 * Respond to User Input.
	 */
	respond = () => {

		// Fall then Jump.
		this.mechanics.fall.listen();
		this.mechanics.jump.listen();

		// Jump modifiers
		this.mechanics.wall.listen();
		this.mechanics.coyote.listen();

		// Left & Right.
		this.mechanics.walk.listen();

		// Orient.
		this.mechanics.orient.listen();
	}

	/**
	 * Recolor the Player.
	 */
	recolor = () => {

		// Assume falling.
		this.color = Settings.player.colors.falling;

		// Default.
		if ( this.physics.contact.bottom ) {
			this.color = Settings.player.colors.default;
		}

		// Wall jump.
		if ( this.mechanics.wall.can() ) {
			this.color = Settings.player.colors.walljump
		};
	}

	/**
	 * Reposition the Player.
	 */
	reposition = () => {

		// Contact.
		this.physics.contact.reset();

		// Get the delta.
		const comp = Game.Frame.compensate;

		// Update X.
		this.physics.position.x = ( this.physics.position.x + comp( this.physics.velocity.x ) );
		this.mechanics.collide.listen( { x: this.physics.velocity.x } );

		// Update Y.
		this.physics.position.y = ( this.physics.position.y + comp( this.physics.velocity.y ) );
		this.mechanics.collide.listen( { y: this.physics.velocity.y } );

		// Update Z.
		this.physics.position.z = ( this.physics.position.z + comp( this.physics.velocity.z ) );
		this.mechanics.collide.listen( { z: this.physics.velocity.z } );
	}

	/**
	 * Do all of the checks.
	 *
	 * @returns {Void}
	 */
	checks = () => {

		// Check for fell.
		if ( this.checkFell() ) {
			return;
		}

		// Check if hit by projectiles.
		if ( this.checkProjectiles() ) {
			return;
		}

		// Check if reached doors.
		if ( this.checkDoors() ) {
			return;
		}
	}

	/**
	 * Check if the Player fell off the bottom of the Room.
	 *
	 * @returns {Boolean}
	 */
	checkFell = () => {

		// Bail if not falling.
		if ( ! this.fell() ) {
			return false;
		}

		// Retry if not invincible.
		if ( ! Settings.player.invincible ) {
			this.retries.current++;
			return Game.Room.retry();
		}

		// Invincible, so force some resets.
		this.physics.position.y   = Game.Room.size.h;
		this.physics.velocity.y   = 0;
		this.mechanics.jump.count = 0;

		// Assume false.
		return false;
	}

	/**
	 * Check if Player collided with Doors.
	 *
	 * @returns {Boolean}
	 */
	checkDoors = () => {

		// Vars.
		let r = Game.Room,
			e = r.tiles,
			g = e.doors,
			l = g.length;

		// Skip if no tiles.
		if ( ! l ) {
			return false;
		}

		// Loop through Doors.
		for ( let i = 0; i < l; i++ ) {
			let check = new Collision( this, g[ i ] );

			// Progress if collision detected.
			if ( check.detect() ) {
				r.load( g[ i ].room );
				return true;
			}
		}

		// Assume false.
		return false;
	}

	/**
	 * Check if Player collided with Projectiles.
	 *
	 * @returns {Boolean}
	 */
	checkProjectiles = () => {

		// Bail if invincible.
		if ( Settings.player.invincible ) {
			return false;
		}

		// Vars.
		let e = Game.Room.tiles,
			p = e.projectiles,
			l = p.length;

		// Skip if no tiles.
		if ( ! l ) {
			return false;
		}

		// Loop through Projectiles.
		for ( let i = 0; i < l; i++ ) {
			let check = new Collision( this, p[ i ] );

			// Retry if collision detected.
			if ( check.detect() ) {
				this.retries.current++;
				return Game.Room.retry();
			}
		}

		// Assume false.
		return false;
	}
}
