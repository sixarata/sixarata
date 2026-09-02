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
		const normalized = entries instanceof Map
			? entries
			: Object.entries( entries );

		this.defaults = new Map( normalized );
		this.reset();
	}

	reset = () => {
		this.modified = new Map( this.defaults );

		return this;
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

	merge = ( entries = {} ) => {
		const normalized = entries instanceof Map
			? entries
			: Object.entries( entries );

		for ( const [ key, value ] of normalized ) {
			this.modified.set( key, value );
		}

		return this;
	}
}
