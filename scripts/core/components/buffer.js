import { Position, Scale, Size } from '../physics/exports.js';
import Screen from '../interfaces/screen.js';

/**
 * The Buffer object.
 *
 * This object is responsible for creating a Canvas element, getting its Context,
 * and provides helper methods for interacting with them.
 */
export default class Buffer {

	/**
	 * Construct the Buffer.
	 *
	 * @param {Size}   size
	 * @param {Scale}  scale
	 * @param {String} context
	 * @param {Object} attr
	 */
	constructor(
		size    = { w: 0, h: 0, d: 0 },
		scale   = { x: 1, y: 1, z: 1 },
		context = '2d',
		attr    = { alpha: true, desynchronized: true }
	) {
		this.set( size, scale, context, attr );
	}

	/**
	 * Initiate the Buffer.
	 *
	 * @param {Size}   size
	 * @param {Scale}  scale
	 * @param {String} context
	 * @param {Object} attr
	 */
	set = (
		size    = { w: 0, h: 0, d: 0 },
		scale   = { x: 1, y: 1, z: 1 },
		context = '2d',
		attr    = { alpha: true, desynchronized: true }
	) => {
		this.reset( size, scale, context, attr );
	}

	/**
	 * Reset the Buffer.
	 *
	 * @param {Size}   size
	 * @param {Scale}  scale
	 * @param {String} context
	 * @param {Object} attr
	 */
	reset = (
		size    = { w: 0, h: 0, d: 0 },
		scale   = { x: 1, y: 1, z: 1 },
		context = '2d',
		attr    = { alpha: true, desynchronized: true }
	) => {

		// Create the canvas.
		this.canvas  = document.createElement( 'canvas' );
		this.context = this.canvas.getContext( context, attr );

		// Accessibility.
		this.canvas.innerText = 'Sorry, but your web browser does not support this.';
		this.context.imageSmoothingEnabled = false;

		// Display & physics.
		this.screen   = new Screen();
		this.position = new Position();

		// Resize & Rescale.
		this.resize( size );
		this.rescale( scale );
	}

	/**
	 * Resize the Buffer.
	 *
	 * @param {Size}    size
	 * @param {Boolean} smooth
	 */
	resize = (
		size   = { w: 0, h: 0, d: 0 },
		smooth = false
	) => {

		// Track size for camera/collision comparisons.
		this.size = {
			w: size.w ?? 0,
			h: size.h ?? 0,
			d: size.d ?? 0,
		};

		// Resize the screen.
		this.screen.resize( this.context.canvas, this.size );

		// Maybe reapply scaling after changes reset the transform.
		if ( this.scale ) {
			this.rescale( this.scale );
		}

		// Smoothing.
		if ( this.context.imageSmoothingEnabled !== smooth ) {
			this.context.imageSmoothingEnabled = smooth;
		}

		// Only resize if needed.
		if (
			( size.w !== this.context.canvas.width )
			||
			( size.h !== this.context.canvas.height )
		) {

			// Set size.
			this.context.canvas.width  = size.w;
			this.context.canvas.height = size.h;
		}
	}

	/**
	 * Tick through time.
	 */
	tick = () => {

	}

	/**
	 * Update the Buffer.
	 */
	update = () => {
		this.erase();
	}

	/**
	 * Render the Buffer.
	 */
	render = () => {

	}

	/**
	 * Rescale the Buffer.
	 *
	 * @param {Scale} scale
	 */
	rescale = (
		scale = { x: 1, y: 1, z: 1 }
	) => {
		this.scale = scale;
		this.screen.scale( this.context, scale );
	}

	/**
	 * Get the contents of the buffer as an image.
	 *
	 * @returns {ImageData}
	 */
	get = () => {
		return this.context.getImageData(
			0,
			0,
			this.context.canvas.width,
			this.context.canvas.height,
		);
	}

	/**
	 * Put the contents of another Buffer's canvas into this one.
	 *
	 * @param {Buffer}   contents
	 * @param {Position} position
	 */
	put = (
		buffer   = {},
		position = { x: 0, y: 0, z: 0 }
	) => {
		buffer.context.drawImage(
			this.canvas,
			position.x,
			position.y,
		);
	}

	/**
	 * Completely obliterate the Buffer.
	 *
	 * This method intends to completely clear the buffer from all
	 * available memory.
	 */
	destroy = () => {
		this.erase();
		this.canvas.remove();
		//delete this;
	}

	/**
	 * Draw a filled rectangle.
	 *
	 * @param {String}   color
	 * @param {Position} position
	 * @param {Size}     size
	 * @param {Number}   opacity
	 */
	rect = (
		color    = '#fff',
		position = { x: 0, y: 0, z: 0 },
		size     = { w: 0, h: 0, d: 0 },
		opacity  = 1
	) => {

		// Properties.
		this.context.fillStyle   = color;
		this.context.globalAlpha = opacity;

		// Draw.
		this.context.fillRect(
			Math.floor( position.x ),
			Math.floor( position.y ),
			Math.floor( size.w ),
			Math.floor( size.h ),
		);
	}

	/**
	 * Open the buffer for writes.
	 */
	open = () => {
		this.context.save();
	}

	/**
	 * Close writes to the buffer.
	 */
	close = () => {
		this.context.restore();
	}

	/**
	 * Draw some text.
	 *
	 * @param {String}   text
	 * @param {Position} position
	 * @param {String}   color
	 * @param {String}   font
	 * @param {Number}   opacity
	 */
	text = (
		text     = '',
		position = { x: 0, y: 0, z: 0 },
		color    = '#fff',
		font     = '20px Courier New',
		opacity  = 1
	) => {

		// Properties.
		this.context.fillStyle   = color;
		this.context.globalAlpha = opacity;
		this.context.font        = font;

		// Draw.
		this.context.fillText( text, position.x, position.y );
	}

	/**
	 * Erase the contents of the Buffer.
	 */
	erase = () => {
		this.context.clearRect(
			0,
			0,
			this.context.canvas.width,
			this.context.canvas.height,
		);
	}
}
