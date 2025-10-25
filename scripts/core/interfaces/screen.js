import Settings from '../../content/settings.js';

/**
 * The Screen object.
 *
 * Owns device pixel ratio, canvas backing-store sizing, and simple
 * world/CSS/backing conversions.
 */
export default class Screen {

	/**
	 * Default Screen settings.
	 *
	 * These are overridden by Settings.interfaces.screen.
	 */
	static defaults = {
		size: 32,
		dpr:  2,
	}

	/**
	 * Construct the Screen.
	 *
	 * @returns {Screen} this
	 */
	constructor() {
		this.set();
		this.listen();

		return this;
	}

	/**
	 * Set properties from settings and environment.
	 *
	 * @returns {Screen} this
	 */
	set = () => {
		return this.reset();
	}

	/**
	 * Reset with resolved settings and environment overrides.
	 *
	 * @returns {Screen} this
	 */
	reset = () => {

		// Sizes.
		this.size  = { w: 0, h: 0, d: 0 };
		this.pixel = { w: 0, h: 0, d: 0 };

		// Settings.
		this.settings = Settings.interfaces.screen ?? Screen.defaults;

		// Tile size.
		this.tile = this.settings.size ?? Screen.defaults.size;

		// Device pixel ratio.
		this.setDpr(
			this.getDpr(
				this.settings.dpr ?? Screen.defaults.dpr
			)
		);

		// Return.
		return this;
	}

	/**
	 * Get the device pixel ratio.
	 *
	 * @param {Number} fallback Fallback DPR if the environment doesn't provide one.
	 * @returns {Number}
	 */
	getDpr = (
		fallback = 2
	) => {

		// Check for the device pixel ratio.
		if ( typeof devicePixelRatio !== 'undefined' && devicePixelRatio ) {
			return devicePixelRatio;
		}

		// Fallback.
		return fallback;
	}

	/**
	 * Set the device pixel ratio.
	 *
	 * @param {Number} value
	 */
	setDpr = (
		value = 2
	) => {

		// Update the device pixel ratio.
		this.dpr = value;
	}

	/**
	 * Convert a pixel value to backing-store pixels.
	 *
	 * @param {Number} n
	 * @returns {Number}
	 */
	px = ( n = 0 ) => ( n * this.dpr );

	/**
	 * Convert a backing-store pixel value to pixels.
	 *
	 * @param {Number} n
	 * @returns {Number}
	 */
	unpx = ( n = 0 ) => ( n / this.dpr );

	/**
	 * Convert world units (tiles) to pixels.
	 *
	 * @param {Number} n
	 * @returns {Number}
	 */
	unit = ( n = 0 ) => ( n * this.tile );

	/**
	 * Convert pixels to world units (tiles).
	 *
	 * @param {Number} n
	 * @returns {Number}
	 */
	world = ( n = 0 ) => ( n / this.tile );

	/**
	 * Apply DPR scaling to a CanvasRenderingContext2D using a vector.
	 *
	 * @param {CanvasRenderingContext2D} ctx
	 * @param {{x:Number,y:Number}} v
	 */
	rescale = (
		ctx,
		v = { x: 1, y: 1 }
	) => {
		ctx.scale(
			( v.x * this.dpr ),
			( v.y * this.dpr )
		);
	}

	/**
	 * Adjust a font string's px size by DPR.
	 *
	 * @param {string} font
	 * @returns {string}
	 */
	font = (
		font = '16px sans-serif'
	) => {
		const i = font.indexOf('px');

		if ( i <= 0 ) {
			return font;
		}

		const size = parseFloat( font.substring( 0, i ) ) || 0;
		const rest = font.substring( i + 2 );
		const adj  = ( size * this.dpr );

		return `${adj}px${rest}`;
	}

	/**
	 * Resize canvas backing store using DPR.
	 *
	 * @param {HTMLCanvasElement} canvas
	 * @param {{w:Number,h:Number,d:Number}} size
	 */
	resize = (
		canvas,
		size = { w: 0, h: 0, d: 0 }
	) => {
		this.size = {
			w: size.w ?? 0,
			h: size.h ?? 0,
			d: size.d ?? 0,
		};

		const pw = Math.floor( this.px( this.size.w ) );
		const ph = Math.floor( this.px( this.size.h ) );

		if ( canvas.width !== pw ) {
			canvas.width  = pw;
		}

		if ( canvas.height !== ph ) {
			canvas.height = ph;
		}

		this.pixel = {
			w: pw,
			h: ph,
			d: this.size.d,
		};
	}

	/**
	 * Current width.
	 *
	 * @returns {Number} The current width.
	 */
	width = () => this.size.w;

	/**
	 * Current height in px.
	 *
	 * @returns {Number} The current height.
	 */
	height = () => this.size.h;

	/**
	 * Add the Listeners.
	 *
	 * @returns {void}
	 */
	listen = () => {

		// Ensure only one active listener at a time.
		this.ignore();

		// Arm the media query listener for the new DPR.
		this.rematch();

		// Skip if no match media query exists.
		if ( ! this.match ) {
			return;
		}

		// Listen for changes to the media query.
		if ( this.match.addEventListener ) {
			this.match.addEventListener(
				'change',
				this.change,
				false
			);
		}
	}

	/**
	 * Re-establish the media query listener.
	 *
	 * @returns {void}
	 */
	rematch = () => {

		// Skip if not in a browser environment.
		if (
			( typeof window === 'undefined' )
			||
			( typeof window.matchMedia !== 'function' )
		) {
			this.unmatch();
			return;
		}

		// Set the query.
		this.match = window.matchMedia( `(resolution: ${this.dpr}dppx)` );
	}

	/**
	 * Remove the media query listener.
	 */
	unmatch = () => {
		this.match = null;
	}

	/**
	 * Handle changes to the device pixel ratio.
	 */
	change = () => {

		// Update DPR from environment.
		this.setDpr( this.getDpr() );

		// Re-listen for changes.
		this.listen();
	}

	/**
	 * Remove the DPR media query listener if present.
	 *
	 * @returns {void}
	 */
	ignore = () => {

		// Skip if no match media query exists.
		if ( ! this.match ) {
			return;
		}

		// Remove the event listener.
		if ( this.match.removeEventListener ) {
			this.match.removeEventListener(
				'change',
				this.change,
				false
			);
		}

		// Clear the match media query.
		this.unmatch();
	}
}
