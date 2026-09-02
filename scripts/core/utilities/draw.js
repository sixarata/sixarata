/**
 * The Draw class.
 *
 * This class is a collection of methods used to draw things on a Canvas.
 */
export default class Draw {

	/**
	 * Construct an empty drawing helper.
	 *
	 * @returns {Draw} this
	 */
	constructor() {
		return this.set();
	}

	/**
	 * Initialize the drawing helper.
	 *
	 * @returns {Draw} this
	 */
	set = () => {
		return this.reset();
	}

	/**
	 * Reset drawing state.
	 *
	 * @returns {Draw} this
	 */
	reset = () => {
		return this;
	}
}
