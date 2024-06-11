import Settings from '../settings.js';
import Game     from '../game.js';

import { Buffer } from './exports.js';

/**
 * The HUD object.
 *
 * This object is responsible for displaying the heads-up-display,
 * showing the Player various in-game information.
 */
export default class Hud {

	/**
	 * The Buffer object.
	 *
	 * @var {Buffer} Default new Buffer().
	 */
	buffer = new Buffer();

	/**
	 * The current Room.
	 *
	 * @var {Number} Default 0.
	 */
	room = 0;

	/**
	 * The current retries.
	 *
	 * @var {Number} Default 0.
	 */
	retries = 0;

	/**
	 * The current frames per second.
	 *
	 * @var {Number} Default 0.
	 */
	fps = 0;

	/**
	 * The current time elapsed.
	 *
	 * @var {Number} Default 0.
	 */
	time = 0;

	/**
	 * Construct the object.
	 */
	constructor() {
		this.set();
	}

	/**
	 * Set the object.
	 */
	set = () => {
		this.reset();
	}

	/**
	 * Reset the HUD.
	 */
	reset = () => {

		// Buffer.
		this.buffer = new Buffer();

		// Attributes.
		this.room    = 0;
		this.retries = 0;
		this.fps     = 0;
		this.time    = 0;

		// Resize.
		this.resize();
	}

	/**
	 * Resize the HUD.
	 */
	resize = () => {
		this.buffer.resize( {
			w: innerWidth,
			h: 30,
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
			frames = Game.Frames,
			player = room.tiles.players[ 0 ];

		// Update attributes.
		this.room    = room.id;
		this.retries = 0; //player.retries.current;
		this.fps     = frames.fps();
		this.time    = clock.elapsed();
	}

	/**
	 * Update the HUD.
	 */
	update = () => {
		Game.Hooks.do( 'Hud.update' );

		let w = ( this.buffer.size.w / this.buffer.scale.dpr );

		this.buffer.open();
		this.buffer.text( '🚀 ' + this.room,    { x: 15,  y: 21 } );
		this.buffer.text( '🔁 ' + this.retries, { x: 90,  y: 21 } );
		this.buffer.text( '⏳ ' + this.time,    { x: 165, y: 21 } );
		this.buffer.text( '🎥 ' + this.fps,     { x: w - 70, y: 21 } );
		this.buffer.close();
	}

	/**
	 * Render the HUD.
	 */
	render = () => {

		// Skip if no HUD.
		if ( ! Settings.hud ) {
			return;
		}

		Game.Hooks.do( 'Hud.render' );

		// Output the Buffer.
		this.buffer.put( Game.View.buffer );
	}
}
