import Game from '../game.js';

import { Buffer } from './exports.js';
import { Position } from '../physics/exports.js';

/**
 * The View object.
 *
 * This object is responsible for buffering the display of the game.
 * It is full-screen, and resizes itself to the window automatically.
 */
export default class View {

	/**
	 * Construct the View.
	 */
	constructor() {
		this.set();
	}

	/**
	 * Set the View.
	 */
	set = () => {
		this.reset();
	}

	/**
	 * Reset the View.
	 */
	reset = () => {

		// Create some tiles.
		this.wrapper = document.createElement( 'div' );
		this.buffer  = new Buffer();
		this.canvas  = this.buffer.canvas;

		// Append tiles to DOM.
		document.body.appendChild( this.wrapper );
		this.wrapper.appendChild( this.canvas );
	}

	/**
	 * Resize the View.
	 */
	resize = () => {
		this.buffer.resize( {
			w: innerWidth,
			h: innerHeight,
		} );
	}

	/**
	 * Early events.
	 */
	hooks = () => {

		// Frames.
		Game.Hooks.add( 'Frames.tick',   this.tick );
		Game.Hooks.add( 'Frames.tick',   this.resize );
		Game.Hooks.add( 'Frames.update', this.update );
		Game.Hooks.add( 'Frames.render', this.render );

		// Buffer.
		Game.Hooks.add( 'View.tick',   this.buffer.tick );
		Game.Hooks.add( 'View.update', this.buffer.update );
		Game.Hooks.add( 'View.render', this.buffer.render );
	}

	/**
	 * Tick through time.
	 */
	tick = () => {
		Game.Hooks.do( 'View.tick' );
	}

	/**
	 * Update the View.
	 */
	update = () => {
		Game.Hooks.do( 'View.update' );
	}

	/**
	 * Render the View.
	 */
	render = () => {
		Game.Hooks.do( 'View.render' );
	}

	/**
	 * Center two rectangles in the View.
	 *
	 * @param {Position} position
	 * @param {Size}     size1
	 * @param {Size}     size2
	 * @param {Scale}    scale
	 * @returns {Position}
	 */
	center = (
		position = { x: 0, y: 0, z: 0 },
		size1    = { w: 0, h: 0, d: 0 },
		size2    = { w: 0, h: 0, d: 0 },
		scale    = 'up'
	) => {
		return new Position(
			( position.x + ( ( size1.w - size2.w ) / 2 ) ),
			( position.y + ( ( size1.h - size2.h ) / 2 ) ),
			( position.z + ( ( size1.d - size2.d ) / 2 ) ),
			scale,
		);
	}
}
