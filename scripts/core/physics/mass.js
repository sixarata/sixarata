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
		return this.set( args );
	}

	/**
	 * Set the Mass.
	 */
	set = ( ...args ) => {
		return this.reset( args );
	}

	/**
	 * Reset the Mass.
	 */
	reset = ( ...args ) => {
		return this;
	}
}
