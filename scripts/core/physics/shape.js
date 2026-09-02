/**
 * Base class for geometric shapes.
 *
 * Shape currently provides the shared lifecycle expected by physics value
 * objects. Concrete shapes can extend set() and reset() as geometry is added.
 */
export default class Shape {

	/** @returns {Shape} A reset shape. */
	constructor() {
		return this.set();
	}

	/** @returns {Shape} this, reset to its defaults. */
	set = () => {
		return this.reset();
	}

	/** @returns {Shape} this */
	reset = () => {
		return this;
	}
}
