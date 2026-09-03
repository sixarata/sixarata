import Settings from '../../../content/settings.js';
import Game from '../../game.js';

/**
 * The Walk mechanic.
 *
 * Smoothly grows horizontal velocity from a tile-relative base speed toward a
 * tile-relative maximum while an exclusive direction is held. Screen converts
 * both rates to logical pixels per second before they enter Velocity. Growth is
 * linear across the millisecond accel window. Runs before Sprint.
 */
export default class Walk {

	/**
	 * Default walk settings.
	 *
	 * @type {Object}
	 */
	static defaults = {
		base: 1,
		speed: 10,
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
		const base   = Game.Screen.unit( this.settings.base );
		const speed  = Game.Screen.unit( this.settings.speed );
		const target = base + ( speed - base ) * ratio;

		if ( l?.down && ! r?.down ) {
			v.x = -Math.max( Math.abs( v.x ), target );
		} else if ( r?.down && ! l?.down ) {
			v.x = Math.max( Math.abs( v.x ), target );
		}
	}
}
