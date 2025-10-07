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
	 * @returns {Buffer} this
	 */
	constructor(
		size    = { w: 0, h: 0, d: 0 },
		scale   = { x: 1, y: 1, z: 1 },
		context = '2d',
		attr    = { alpha: true, desynchronized: true }
	) {
		return this.set( size, scale, context, attr );
	}

	/**
	 * Initiate the Buffer.
	 *
	 * @param {Size}   size
	 * @param {Scale}  scale
	 * @param {String} context
	 * @param {Object} attr
	 * @returns {Buffer} this
	 */
	set = (
		size    = { w: 0, h: 0, d: 0 },
		scale   = { x: 1, y: 1, z: 1 },
		context = '2d',
		attr    = { alpha: true, desynchronized: true }
	) => {
		return this.reset( size, scale, context, attr );
	}

	/**
	 * Reset the Buffer.
	 *
	 * @param {Size}   size
	 * @param {Scale}  scale
	 * @param {String} context
	 * @param {Object} attr
	 * @returns {Buffer} this
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

		// Return.
		return this;
	}

	/**
	 * Resize the Buffer.
	 *
	 * @param {Size} size
	 */
	resize = (
		size = { w: 0, h: 0, d: 0 }
	) => {

		// Skip if not resizing.
		if (
			( size?.w ?? 0 ) === ( this.size?.w ?? 0 )
			&&
			( size?.h ?? 0 ) === ( this.size?.h ?? 0 )
			&&
			( size?.d ?? 0 ) === ( this.size?.d ?? 0 )
		) {
			return;
		}

		// Track size for camera/collision comparisons.
		this.size = {
			w: size.w ?? 0,
			h: size.h ?? 0,
			d: size.d ?? 0,
		};

		// Resize the canvas using screen DPR.
		this.screen.resize( this.context.canvas, this.size );

		// Resize the canvas.
		this.context.canvas.width  = size.w;
		this.context.canvas.height = size.h;

		// Return.
		return this.canvas;
	}

	/**
	 * Rescale the Buffer.
	 *
	 * @param {Scale} scale
	 */
	rescale = (
		scale = { x: 1, y: 1, z: 1 }
	) => {

		// Skip if not resizing.
		if (
			( scale?.x ?? 1 ) === ( this.scale?.x ?? 1 )
			&&
			( scale?.y ?? 1 ) === ( this.scale?.y ?? 1 )
			&&
			( scale?.z ?? 1 ) === ( this.scale?.z ?? 1 )
		) {
			return;
		}

		// Track size for camera/collision comparisons.
		this.scale = {
			x: scale.x ?? 1,
			y: scale.y ?? 1,
			z: scale.z ?? 1,
		};

		// Rescale the canvas using screen DPR.
		this.screen.rescale( this.context, this.scale );

		// Return.
		return this;
	}

	/**
	 * Resmooth the Buffer.
	 *
	 * @param {Boolean} smooth
	 */
	resmooth = (
		smooth = false
	) => {
		if ( this.context.imageSmoothingEnabled !== smooth ) {
			this.context.imageSmoothingEnabled = smooth;
		}

		// Return.
		return this;
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
