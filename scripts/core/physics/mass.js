/**
 * The Mass object.
 *
 * This object represents the fundamental measure of the amount of
 * matter in the object.
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

	}
}
