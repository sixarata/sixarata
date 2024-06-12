import Attributes from "./attributes.js";

/**
 * The Generic object.
 *
 * This object is responsible for the Generic attributes of any Component.
 */
export default class Generic {

	/**
	 * Attributes.
	 *
	 * @type {Attributes}
	 */
	attributes = new Attributes();

	/**
	 * Construct the Generic object.
	 *
	 * @param {Entries} entries
	 */
	constructor(
		entries = {}
	) {
		this.attributes = new Attributes( entries );
	}

	/**
	 * Set the Generic object.
	 *
	 * @param {Key} string
	 * @param {Value} any
	 */
	set = (
		key   = '',
		value = {}
	) => {
		this.attributes.set( key, value );
	}

	/**
	 * Get the Generic object.
	 *
	 * @param {Key} string
	 */
	get = (
		key = ''
	) => {
		this.attributes.get( key );
	}

	/**
	 *
	 * @param {Object} entries
	 */
	merge = (
		entries = {}
	) => {
		this.attributes.merge( entries );
	}

	/**
	 * Reset the Generic object.
	 *
	 * @param {Entries} entries
	 */
	reset = () => {
		this.attributes.reset();
	}

	/**
	 * Resize the Generic object.
	 */
	resize = () => {

	}

	/**
	 * Advance the Generic object.
	 */
	tick = () => {

	}

	/**
	 * Update the Generic object.
	 */
	update = () => {

	}

	/**
	 * Render the Generic object.
	 */
	render = () => {

	}

	/**
	 * Destroy the Generic object.
	 *
	 * @returns {Boolean}
	 */
	destroy = () => {
		// delete this
		return true;
	}
}
