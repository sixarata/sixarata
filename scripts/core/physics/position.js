import Scale from './scale.js';
import Point from './point.js';

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
	 * @param {Int}    x
	 * @param {Int}    y
	 * @param {String} scale
	 */
	constructor( x = 0, y = 0, scale = 'up' ) {
		super( x, y );

		this.set( scale );
	}

	/**
	 * Set the object.
	 *
	 * @param {String} scale
	 * @returns {Position}
	 */
	set = ( scale = 'up' ) => {

		// Setup the Scale.
		this.scale = new Scale( this.x, this.y );

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
	rescale = ( type = 'up' ) => {

		// Scale UP.
		if ( ( 'up' === type ) && ( 'up' !== this.scaled ) ) {
			this.x = this.scale.up( this.scale.x );
			this.y = this.scale.up( this.scale.y );

		// Scale DOWN.
		} else if ( ( 'down' === type ) && ( 'down' !== this.scaled ) ) {
			this.x = this.scale.down( this.scale.x );
			this.y = this.scale.down( this.scale.y );

		// Reset.
		} else {
			this.x = this.scale.x;
			this.y = this.scale.y;
		}

		// Set type.
		this.scaled = type;

		// Return object.
		return this;
	}
}
