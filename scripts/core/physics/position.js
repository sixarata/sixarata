import { Point, Scale } from './exports.js';

/**
 * The Position object.
 *
 * This object is responsible for storing & manipulating the Point of
 * an object. See also: Size.
 */
export default class Position extends Point {

	/**
	 * Construct the object.
	 *
	 * @param {Number} x
	 * @param {Number} y
	 * @param {Number} z
	 * @param {String} scale
	 */
	constructor(
		x     = 0,
		y     = 0,
		z     = 0,
		scale = 'up'
	) {
		super( x, y, z );

		this.set( scale );
	}

	/**
	 * Set the object.
	 *
	 * @param {String} scale
	 * @returns {Position}
	 */
	set = (
		scale = 'up'
	) => {

		// Setup the Scale.
		this.scale = new Scale( this.x, this.y, this.z );

		// Scale.
		this.rescale( scale );

		// Return.
		return this;
	}

	/**
	 * Reset the Position.
	 *
	 * @returns {Position}
	 */
	reset = () => {
		return this.rescale( false );
	}

	/**
	 * Scale, Unscale, or reset a Position back to its original values.
	 *
	 * @param {String} type
	 * @returns {Position}
	 */
	rescale = (
		type = 'up'
	) => {

		// Scale UP.
		if ( ( 'up' === type ) && ( 'up' !== this.scaled ) ) {
			this.x = this.scale.up( this.scale.x );
			this.y = this.scale.up( this.scale.y );
			this.z = this.scale.up( this.scale.z );

		// Scale DOWN.
		} else if ( ( 'down' === type ) && ( 'down' !== this.scaled ) ) {
			this.x = this.scale.down( this.scale.x );
			this.y = this.scale.down( this.scale.y );
			this.z = this.scale.down( this.scale.z );

		// Reset.
		} else {
			this.x = this.scale.x;
			this.y = this.scale.y;
			this.z = this.scale.z;
		}

		// Set type.
		this.scaled = type;

		// Return object.
		return this;
	}
}
