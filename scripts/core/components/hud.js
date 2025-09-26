import Game from '../game.js';
import Time from '../utilities/time.js';
import Settings from '../../custom/settings.js';

import { Buffer } from './exports.js';

/**
 * The HUD object.
 *
 * This object is responsible for displaying the heads-up-display,
 * showing the Player various in-game information.
 */
export default class Hud {

	/**
	 * Construct the object.
	 *
	 * @returns {Hud} this
	 */
	constructor() {
		return this.set();
	}

	/**
	 * Set the object.
	 *
	 * @returns {Hud} this
	 */
	set = () => {
		return this.reset();
	}

	/**
	 * Reset the HUD.
	 *
	 * @returns {Hud} this
	 */
	reset = () => {

		// Buffer.
		this.buffer = new Buffer();

		// Attributes.
		this.room    = 0;
		this.retries = 0;
		this.time    = 0;
		this.frames  = 0;
		this.flast   = Time.now;

		// Resize.
		this.resize();

		// Return.
		return this;
	}

	/**
	 * Resize the HUD.
	 */
	resize = () => {
		this.buffer.resize( {
			w: innerWidth,
			h: 30,
			d: 1,
		} );
	}

	/**
	 * Early events.
	 */
	hooks = () => {

		// View.
		Game.Hooks.add( 'View.tick',   this.tick );
		Game.Hooks.add( 'View.update', this.update );
		Game.Hooks.add( 'View.render', this.render );
		Game.Hooks.add( 'View.tick',   this.resize );

		// Buffer.
		Game.Hooks.add( 'Hud.tick',    this.buffer.tick );
		Game.Hooks.add( 'Hud.update',  this.buffer.update );
		Game.Hooks.add( 'Hud.render',  this.buffer.render );
	}

	/**
	 * Tick through time.
	 */
	tick = () => {
		Game.Hooks.do( 'Hud.tick' );

		// Vars.
		let room   = Game.Room,
			clock  = Game.Clock,
			frames = Game.Frame,
			player = room.tiles.players[ 0 ];

		// Update attributes.
		this.room    = room.id;
		this.retries = 0; //player.retries.current;
		this.time    = clock.elapsed();

		// FPS (sample every 500ms using shared Time).
		const now = Time.now;
		if ( ( now - this.flast ) >= 500 ) {
			this.flast  = now;
			this.frames = frames.fps();
		}
	}

	/**
	 * Update the HUD.
	 */
	update = () => {
		Game.Hooks.do( 'Hud.update' );

		let w = this.buffer.screen.width() - 70;

		this.buffer.open();
		this.buffer.text( '🚀 ' + this.room,    { x: 15,  y: 21 } );
		this.buffer.text( '🔁 ' + this.retries, { x: 90,  y: 21 } );
		this.buffer.text( '⏳ ' + this.time,    { x: 165, y: 21 } );
		this.buffer.text( '🎥 ' + this.frames,  { x: w,   y: 21 } );
		this.buffer.close();
	}

	/**
	 * Render the HUD.
	 */
	render = () => {

		// Skip if no HUD.
		if ( ! Settings.components.view.hud ) {
			return;
		}

		Game.Hooks.do( 'Hud.render' );

		// Output the Buffer.
		this.buffer.put( Game.View.buffer );
	}
}
