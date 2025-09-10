import Settings from '../../../custom/settings.js';
import Game from '../../game.js';
import Time from '../../utilities/time.js';
import { Particle } from '../../tiles/exports.js';

/**
 * The WallSlide mechanic.
 *
 * Applies a reduced gravity (vertical velocity dampening) while the player is
 * holding toward a wall they are currently in lateral contact with. This
 * creates a controllable descent (wall slide) prior to performing a wall jump
 * or releasing to free‑fall.
 */
export default class WallSlide {

	/**
	 * Construct.
     *
	 * @param {Tile|null} tile
	 */
	constructor( tile = null ) {
		this.set( tile );
	}

	/**
	 * Bind (or rebind) the mechanic to a tile.
     *
	 * @param {Tile|null} tile
	 */
	set = ( tile = null ) => {
		this.reset();
		this.tile = tile;
		this.velocity = this.tile?.physics?.velocity;
		this.contact  = this.tile?.physics?.contact;
	}

	/** Reset internal state. */
	reset = () => {
		this.tile      = null;
		this.velocity  = null;
		this.contact   = null;
		this.listening = true;

		// Configurable slide factor: fraction of normal gravity applied while sliding.
		// If future settings exposed, read from Settings.player.jumps.wall.slide?.factor
		const slideCfg = Settings.player?.jumps?.wall?.slide || {};
		this.factor = ( slideCfg.factor ?? 0.35 );
		// Optional max slide speed (can be lower than normal terminal to feel sticky)
		this.max    = ( slideCfg.max    ?? Settings.player.jumps.fall.speed * 0.75 );
	}

	/** Primary loop hook. */
	listen = () => {
		if ( ! this.listening || ! this.tile ) return;
		if ( this.can() ) this.do();
	}

	/** Are we currently performing a wall slide? */
	doing = () => {
		return this.can();
	}

	/**
	 * Eligibility check.
	 * Conditions:
	 * - Tile exists and has physics/contact.
	 * - Tile is NOT grounded.
	 * - Player is in contact with left OR right wall (exclusive or both).
	 * - Player is holding the direction INTO the wall (e.g. holding 'left' while in left contact).
	 * - Vertical velocity is downward (y > 0) OR zero (allow initial engage before falling).
	 */
	can = () => {
		if ( ! this.tile ) return false;
		if ( ! this.contact ) return false;
		if ( this.contact.bottom ) return false; // grounded

		const holdL = Game.History.hold( 'left' );
		const holdR = Game.History.hold( 'right' );

		const intoLeft  = this.contact.left  && holdL?.down;
		const intoRight = this.contact.right && holdR?.down;

		if ( ! ( intoLeft || intoRight ) ) return false;

		// Must be descending or neutral; if moving upward strongly (e.g., after jump) skip.
		const vy = this.velocity?.y ?? 0;
		return ( vy >= 0 );
	}

	/**
	 * Apply slide dampening (reduced gravity application).
	 */
	do = () => {
		if ( ! this.velocity ) return;
		const gravity = Game.Gravity.force;
		const inc = gravity * this.factor * Time.scale;
		if ( this.velocity.y < this.max ) {
			this.velocity.y += inc;
			if ( this.velocity.y > this.max ) this.velocity.y = this.max;
		} else if ( this.velocity.y > this.max ) {
			this.velocity.y = this.max;
		}
	}
}
