/**
 * The Attributes object.
 *
 * This object is responsible for the Attributes of any Component.
 */
export default class Attributes {

	/**
	 * Default attributes.
	 */
	defaults = new Map();

	/**
	 * Modified attributes.
	 */
	modified = new Map();

	/**
	 * Construct the Attributes object.
	 *
	 * @param {Iterable} entries
	 */
	constructor(
		entries = {}
	) {
		this.defaults = new Map( entries );
		this.reset( entries );
	}

	reset = () => {
		return this.modified = this.defaults;
	}

	clear = () => {
		return this.modified.clear();
	}

	set = (
		key   = '',
		value = {}
	) => {
		return this.modified.set( key, value );
	}

	get = ( key = '' ) => {
		return this.modified.get( key );
	}
}