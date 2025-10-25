import Settings from '../../../content/settings.js';
import Game from '../../game.js';

/**
 * The Walk mechanic.
 *
 * Smoothly grows horizontal velocity from base speed toward max speed while
 * an exclusive direction is held. Growth is linear: duration/accel window.
 * Runs before Sprint so Sprint can overwrite velocity when that tier engages.
 */
export default class Walk {

	/**
	 * Default walk settings.
	 *
	 * @type {Object}
	 */
	static defaults = {
		base: 1,
		speed: 16,
		accel: 250,
	}

	/**
	 * Construct the Walk mechanic.
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
		this.settings  = Settings.player?.move ?? Walk.defaults;
		this.listening = true;

		return this;
	}

	/**
	 * Listen for acceleration input.
	 */
	listen = () => {

		// Skip if disabled or unbound.
		if ( ! this.listening || ! this.tile ) {
			return;
		}

		// Skip if no velocity.
		const v = this.tile.physics?.velocity;
		if ( ! v ) {
			return;
		}

		const l = Game.History.hold( 'left' );
		const r = Game.History.hold( 'right' );

		const dur = l?.down && ! r?.down
			? l.duration
			: ( r?.down && ! l?.down ? r.duration : 0 );

		// Skip if no duration.
		if ( ! dur ) {
			return;
		}

		// Calculate target speed based on hold duration within accel window.
		const ratio  = Math.min( dur, this.settings.accel ) / this.settings.accel;
		const target = this.settings.base + ( this.settings.speed - this.settings.base ) * ratio;

		if ( l?.down && ! r?.down ) {
			v.x = -Math.max( Math.abs( v.x ), target );
		} else if ( r?.down && ! l?.down ) {
			v.x = Math.max( Math.abs( v.x ), target );
		}
	}
}