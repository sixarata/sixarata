import Settings from '../../custom/settings.js';

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
     * These are overridden by Settings.scale.
     */
    static defaults = {
        size: 32,
        dpr:  2,
    }

    /**
     * Construct the Screen.
     */
    constructor() {
        this.set();
    }

    /**
     * Set properties from settings and environment.
     */
    set = () => {
        this.reset();
    }

    /**
     * Reset with resolved settings and environment overrides.
     */
    reset = () => {

        // Settings (mirror Frame.defaults pattern)
        this.settings = Settings.scale ?? Screen.defaults;

        // Tile size.
        this.tile = this.settings.size ?? Screen.defaults.size;

        // Device pixel ratio used for backing store (env wins over settings)
        this.dpr = (typeof devicePixelRatio !== 'undefined' && devicePixelRatio)
            ? devicePixelRatio
            : ( this.settings.dpr ?? Screen.defaults.dpr );

        // Track sizes.
        this.size = { w: 0, h: 0, d: 0 };
        this.pixel   = { w: 0, h: 0, d: 0 };
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
     * @param {{x:number,y:number}} v
     */
    scale = (
        ctx,
        v = { x: 1, y: 1 }
    ) => {
        ctx.scale( ( v.x * this.dpr ), ( v.y * this.dpr ) );
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
     * @param {{w:number,h:number,d:number}} size
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
}
