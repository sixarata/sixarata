/**
 * The Mass object.
 *
 * This object is responsible for everything related to the density of
 * a thing.
 */
export default class Mass {

	/**
	 * Construct the Mass.
	 */
	constructor( ...args ) {
		this.set( args );
	}

	/**
	 * Set the Mass.
	 */
	set = ( ...args ) => {
		this.reset( args );
	}

	/**
	 * Reset the Mass.
	 */
	reset = ( ...args ) => {
		this.start = 1;
	}
}
