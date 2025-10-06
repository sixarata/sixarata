import { Point, Scale } from './exports.js';

/**
 * The Position object.
 *
 * This object is responsible for storing & manipulating the Point of
 * an object. See also: Size.
 */
export default class Position extends Point {

	/**
	 * Default position settings.
	 *
	 * @type {Object}
	 */
	static defaults = {
		scale: 'up',
	}

	/**
	 * Construct the object.
	 *
	 * @param {Number} x Coordinate. Default 0.
	 * @param {Number} y Coordinate. Default 0.
	 * @param {Number} z Coordinate. Default 0.
	 * @param {String} scale
	 */
	constructor(
		x     = Point.defaults.x,
		y     = Point.defaults.y,
		z     = Point.defaults.z,
		scale = Position.defaults.scale
	) {
		super( x, y, z );

		// Return.
		return this.set( scale );
	}

	/**
	 * Set the object.
	 *
	 * @param {String} scale
	 * @returns {Position}
	 */
	set = (
		scale = Position.defaults.scale
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
		type = Position.defaults.scale
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

		// Return.
		return this;
	}
}
