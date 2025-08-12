import { Position, Scale, Size } from '../physics/exports.js';

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

		// Scale.
		this.scale = new Scale();

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

		// Adjust the size based on the pixel ratio.
		size = new Size(
			size.w * this.scale.dpr,
			size.h * this.scale.dpr,
			size.d * this.scale.dpr,
			false
		);

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

			// Size.
			this.size = size;

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
		scale = { x: 300, y: 300, z: 0 }
	) => {
		this.context.scale(
			( scale.x * this.scale.dpr ),
			( scale.y * this.scale.dpr )
		);
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

		// Adjust the font size based on the pixel ratio.
		let fontSize = font.substring( 0, font.indexOf( 'px' ) ),
			adjusted = fontSize * this.scale.dpr;

		// Override the font parameter, with adjusted size.
		font = adjusted + 'px' + font.substring( font.indexOf( 'px' ) + 2 );

		// Properties.
		this.context.fillStyle   = color;
		this.context.globalAlpha = opacity;
		this.context.font        = font;

		// Draw.
		this.context.fillText(
			text,
			( position.x * this.scale.dpr ),
			( position.y * this.scale.dpr ),
		);
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
