import Scale from './scale.js';

/**
 * The Size object.
 *
 * This object is responsible for storing & manipulating the W & H coordinates of
 * an object. See also: Position.
 */
export default class Size {

	/**
	 * Construct the object.
	 *
	 * @param {Number} w
	 * @param {Number} h
	 * @param {Number} d
	 * @param {String} scale
	 */
	constructor(
		w     = 0,
		h     = 0,
		d     = 0,
		scale = 'up'
	) {
		this.set( w, h, d, scale );
	}

	/**
	 * Set the object.
	 *
	 * @param {Number} w
	 * @param {Number} h
	 * @param {Number} d
	 * @param {String} scale
	 */
	set = (
		w     = 0,
		h     = 0,
		d     = 0,
		scale = 'up'
	) => {

		// Attributes.
		this.w = w;
		this.h = h;
		this.d = d;

		// Setup the Scale.
		this.scale = new Scale( w, h, d );

		// Scale.
		this.rescale( scale );
	}

	/**
	 * Reset the Size.
	 *
	 * @returns {Size}
	 */
	reset = () => {
		return this.rescale( false );
	}

	/**
	 * Scales the Size.
	 *
	 * @param   {String} type
	 * @returns {Size}
	 */
	rescale = (
		type = 'up'
	) => {

		if (
			( 'up' === type )
			&&
			( 'up' !== this.scaled )
		) {
			this.w = this.scale.up( this.scale.x );
			this.h = this.scale.up( this.scale.y );
			this.d = this.scale.up( this.scale.z );

		} else if (
			( 'down' === type )
			&&
			( 'down' !== this.scaled )
		) {
			this.w = this.scale.down( this.scale.x );
			this.h = this.scale.down( this.scale.y );
			this.d = this.scale.down( this.scale.z );

		} else {
			this.w = this.scale.x;
			this.h = this.scale.y;
			this.d = this.scale.z;
		}

		this.scaled = type;

		return this;
	}
}
