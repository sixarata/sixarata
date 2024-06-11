import Settings from '../settings.js';
import Game     from '../game.js';

import { Tile } from './exports.js';
import { Collision, Contact, Orientation, Position, Velocity } from '../physics/exports.js';

/**
 * The Player object.
 *
 * This object is responsible for everything related to a Player.
 */
export default class Player extends Tile {

	/**
	 * The Player's retries.
	 *
	 * @var {Object} Default from Settings.
	 */
	retries = Settings.player.retries;

	/**
	 * The Player's health.
	 *
	 * @var {Object} Default from Settings.
	 */
	health = Settings.player.health;

	/**
	 * The Player's jumps.
	 *
	 * @var {Object} Default from Settings.
	 */
	jumps = Settings.player.jumps;

	/**
	 * The Player's contact.
	 *
	 * @var {Contact} Default new Contact().
	 */
	contact = new Contact();

	/**
	 * The Player's orientation.
	 *
	 * @var {Orientation} Default new Orientation().
	 */
	orientation = new Orientation();

	/**
	 * The Player's velocity.
	 *
	 * @var {Velocity} Default new Velocity().
	 */
	velocity = new Velocity();

	/**
	 * The Player's input.
	 *
	 * @var {Object} Default from Game.
	 */
	input = Game.Input;

	/**
	 * The Player's velocity.
	 *
	 * @var {Object} Default from Game.
	 */
	pressed = this.input.pressed;

	/**
	 * Construct the Player.
	 *
	 * @param {Array}    group
	 * @param {Position} position
	 * @param {Size}     size
	 */
	constructor(
		group    = [],
		position = { x: 0, y: 0 },
		size     = { w: 1, h: 1 }
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

		// Retries.
		this.retries = Settings.player.retries

		// Health.
		this.health = Settings.player.health;

		// Jumps.
		this.jumps = Settings.player.jumps;

		// Contact.
		this.contact = new Contact();

		// Orientation.
		this.orientation = new Orientation( 90, 0 );

		// Velocity.
		this.velocity = new Velocity( 0, 0 );

		// Input.
		this.input   = Game.Input;
		this.pressed = this.input.pressed;
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

		// Reorient.
		this.reorient();
	}

	/**
	 * Check if the Player has moved at all.
	 *
	 * @returns {Boolean}
	 */
	moved = () => {
		return (
			Object.getOwnPropertyNames( this.input.keysDown ).length > 0
		);
	}

	/**
	 * Check if the Player has fallen to the bottom of the Room.
	 *
	 * @returns {Boolean}
	 */
	fell = () => {
		return ( this.position.y > Game.Room.size.h );
	}

	/**
	 * Respond to User Input.
	 */
	respond = () => {

		// Jump & Fall.
		this.respondY();

		// Left & Right.
		this.respondX();
	}

	/**
	 * Respond to Jumping.
	 */
	respondY = () => {

		const comp = Game.Frames.compensate;

		// On ground.
		if ( this.contact.bottom ) {
			this.velocity.y = comp( Game.Gravity.force );

		// Not on ground.
		} else {

			// Jump maxed out, or falling.
			if ( this.velocity.y <= this.jumps.power ) {
				this.velocity.y = this.velocity.y + comp( Game.Gravity.force );
			}

			// Never fall faster than jump power.
			if ( this.velocity.y > this.jumps.power ) {
				this.velocity.y = this.jumps.power;
			}
		}

		// Jump.
		if ( this.input.pressed( Settings.input.jump ) && this.canJump() ) {

			// Bump jumps if not wall jumping.
			if ( ! this.canWallJump() ) {
				this.jumps.current++;
			}

			// Adjust the Y velocity.
			this.velocity.y = -this.jumps.power;

			Game.Hooks.do( 'Player.jump' );
		}

		// Filter.
		this.velocity.y = Game.Hooks.do( 'Player.respondY', this.velocity.y );
	}

	/**
	 * Respond to Left and Right.
	 */
	respondX = () => {

		const diff = Game.Frames.diff();

		// Left + Right.
		if ( this.pressed( Settings.input.right ) && this.pressed( Settings.input.left ) ) {
			this.velocity.x = 0;

		// Move left.
		} else if ( this.pressed( Settings.input.left ) ) {
			this.velocity.x = -Settings.player.speed;

		// Move right.
		} else if ( this.pressed( Settings.input.right ) ) {
			this.velocity.x = Settings.player.speed;
		}

		// Slow down.
		if ( ! this.pressed( Settings.input.right ) && ! this.pressed( Settings.input.left ) ) {
			this.velocity.x *= ( Game.Friction.force / diff );
		}

		// Prevent infinitely small X.
		if ( Math.abs( this.velocity.x ) < Game.Friction.force ) {
			this.velocity.x = 0;
		}

		// Filter.
		this.velocity.x = Game.Hooks.do( 'Player.respondX', this.velocity.x );
	}

	/**
	 * Reorient the Player.
	 */
	reorient = () => {

		// Right.
		if ( this.pressed( Settings.input.right ) ) {
			this.orientation.x = 90;
		}

		// Left.
		if ( this.pressed( Settings.input.left ) ) {
			this.orientation.x = 270;
		}

		this.orientation.y = 0;
	}

	/**
	 * Recolor the Player.
	 */
	recolor = () => {

		// Assume falling.
		this.color = Settings.player.colors.falling;

		// Default.
		if ( this.contact.bottom ) {
			this.color = Settings.player.colors.default;
		}

		// Wall jump.
		if ( this.canWallJump() ) {
			this.color = Settings.player.colors.walljump;
		}
	}

	/**
	 * Reposition the Player.
	 */
	reposition = () => {

		// Contact.
		this.contact.reset();

		// Get the delta.
		const comp = Game.Frames.compensate;

		// Update X.
		this.position.x = ( this.position.x + comp( this.velocity.x ) );
		this.collide( {
			x: this.velocity.x,
		} );

		// Update Y.
		this.position.y = ( this.position.y + comp( this.velocity.y ) );
		this.collide( {
			y: this.velocity.y,
		} );
	}

	/**
	 * Collide with solid Tiles (Platforms, Walls, etc...)
	 *
	 * @param   {Velocity} velocity
	 * @returns {Void}
	 */
	collide = (
		velocity = {
			x: 0,
			y: 0
		}
	) => {

		// Default.
		let p = Game.Room.tiles.platforms.concat(
				Game.Room.tiles.walls
			),
			l = p.length;

		// Skip if no tiles.
		if ( ! l ) {
			return;
		}

		// Loop through Platforms.
		for ( let i = 0; i < l; i++ ) {

			let pf = p[ i ];

			// Skip if no density.
			if ( ! pf.density ) {
				continue;
			}

			let check = new Collision( this, pf );

			// Skip if not collided.
			if ( ! check.detect() ) {
				continue;
			}

			// Check contact.
			this.contact.check( velocity, this, pf );
		}
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

		// I'm flying!
		this.position.y    = Game.Room.size.h;
		this.velocity.y    = 0;
		this.jumps.current = 0;

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

	/**
	 * Is the Player falling.
	 *
	 * @returns {Boolean}
	 */
	falling = () => {
		return (
			// No jumps done.
			! this.jumps.current
			&&
			// Making contact with ground.
			! this.contact.bottom
		);
	}

	/**
	 * Can the Player jump?
	 *
	 * @returns {Boolean}
	 */
	canJump = () => {
		return (
			! this.falling()
			&&
			// Has jumps.
			this.jumps.max
			&&
			(
				// Making contact with ground.
				this.contact.bottom
				||
				// Still has jumps to do.
				( this.jumps.current < this.jumps.max )
				||
				// Making contact with wall.
				(
					Settings.player.jumps.wall
					&&
					this.touchingWall()
				)
			)
		);
	}

	/**
	 * Can the Player wall-jump?
	 *
	 * @returns {Boolean}
	 */
	canWallJump = () => {
		return (
			Settings.player.jumps.wall
			&&
			// Has jumps.
			this.jumps.max
			&&
			// Not on ground.
			! this.contact.bottom
			&&
			// Making contact with wall.
			this.touchingWall()
		);
	}

	/**
	 * Is the Player touching a wall?
	 *
	 * @returns {Boolean}
	 */
	touchingWall = () => {
		return (
			this.contact.left
			||
			this.contact.right
		);
	}
}
