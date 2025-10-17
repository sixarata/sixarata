import Game from '../game.js';
import Settings from '../../custom/settings.js';
import Time from '../utilities/time.js';

import { Tile } from './exports.js';
import { Collision, Contact, Orientation, Position, Velocity } from '../physics/exports.js';
import { Collide, Coyote, Dash, Fall, Jump, Orient, WallGrab, WallJump, WallSlide, WallClimb, Nudge, Walk, Sprint, Brake, MicroTap, Decay } from '../mechanics/exports.js';

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

		return this.set();
	}

	/**
	 * Set the Player.
	 */
	set = () => {
		return this.reset();
	}

	/**
	 * Reset the object.
	 */
	reset = () => {

		// Settings.
		this.retries = Settings.player.retries;
		this.health  = Settings.player.health;

		// Physics
		this.physics.contact     = new Contact();
		this.physics.orientation = new Orientation( 90, 0, 0 );
		this.physics.velocity    = new Velocity( 0, 0 );

		// Mechanics (including horizontal movement stages bundled here).
		this.mechanics = {
			collide:  new Collide( this ),
			coyote:   new Coyote( this ),
			dash:     new Dash( this ),
			fall:     new Fall( this ),
			jump:     new Jump( this ),
			orient:   new Orient( this ),

			// Wall mechanics.
			wall: {
				grab:  new WallGrab( this ),
				jump:  new WallJump( this ),
				climb: new WallClimb( this ),
				slide: new WallSlide( this ),
			},

			// Horizontal locomotion pipeline with keyed access + ordered array.
			walk: {
				nudge:  new Nudge( this ),
				brake:  new Brake( this ),
				base:   new Walk( this ),
				sprint: new Sprint( this ),
				micro:  new MicroTap( this ),
				decay:  new Decay( this ),
			},
		};

		// Register combo hook listeners for mechanics that need them.
		this.mechanics.dash.hooks();

		// Return.
		return this;
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

		// Get mechanics.
		const mech = this.mechanics;

		// Wall mechanics first (to establish grab state and check for climb/slide).
		// Note: Both climb and slide require an active grab to function.
		const wall = mech.wall;
		if ( wall ) {
			for ( const key of Object.keys( wall ) ) {
				const stage = wall[ key ];

				if ( stage?.listen && stage.listening ) {
					stage.listen();
				}
			}
		}

		// Vertical mechanics: fall applies only if NOT climbing, sliding, or gripping.
		// Check if wall slide, climb, or active grip before applying fall.
		if ( ! ( wall.climb?.doing() || wall.slide?.doing() || wall.grab?.gripping() ) ) {
			mech.fall.listen();
		}

		// Horizontal movement (intent) before ledge assist: iterate stage list.
		const walk = mech.walk;
		if ( walk ) {
			for ( const key of Object.keys( walk ) ) {
				const stage = walk[ key ];

				if ( stage?.listen && stage.listening ) {
					stage.listen();
				}
			}
		}

		// Coyote window check (before jump).
		mech.coyote.listen();

		// Jump.
		mech.jump.listen();

		// Dash.
		mech.dash.listen();

		// Orientation last.
		mech.orient.listen();

		// Respond hook.
		Game.Hooks.do( 'Player.respond', this );
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

		// Wall grab.
		if ( this.mechanics.wall.grab?.doing() ) {
			this.color = Settings.player.colors.wallgrab;
		}

		// Wall jump.
		if ( this.mechanics.wall.jump?.can() ) {
			this.color = Settings.player.colors.walljump;
		}

		// Coyote jump.
		if ( this.mechanics.coyote.can() ) {
			this.color = Settings.player.colors.coyote;
		}

		// Dash.
		if ( this.mechanics.dash.active() ) {
			this.color = Settings.player.colors.dash;
		}
	}

	/**
	 * Reposition the Player.
	 */
	reposition = () => {

		// Contact.
		this.physics.contact.reset();

		// Cached per-frame movement scale.
		const scale = ( Time.scale / Game.Screen.dpr );

		// Update X.
		this.physics.position.x += ( this.physics.velocity.x * scale );
		this.mechanics.collide.listen( { x: this.physics.velocity.x } );

		// Update Y.
		this.physics.position.y += ( this.physics.velocity.y * scale );
		this.mechanics.collide.listen( { y: this.physics.velocity.y } );

		// Update Z.
		this.physics.position.z += ( this.physics.velocity.z * scale );
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

		// Skip if not falling.
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

		// Skip if invincible.
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
