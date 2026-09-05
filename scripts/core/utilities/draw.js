/**
 * Shared synchronous drawing context for presentation passes.
 * Layers select a destination and logical viewpoint without binding content
 * objects to a permanent presentation owner. No surfaces are owned here.
 */
class Draw {

	/**
	 * Active borrowed drawing Buffer, or null outside a presentation pass.
	 * @type {Buffer|null}
	 */
	buffer;

	/**
	 * Active logical-pixel viewpoint, or null outside a presentation pass.
	 * @type {Object|null}
	 */
	viewpoint;

	/**
	 * Construct the shared drawing context.
	 * @returns {Draw} this
	 */
	constructor() {
		return this.set();
	}

	/**
	 * Initialize an inactive drawing context outside any rendering pass.
	 * @returns {Draw} this
	 */
	set = () => this.reset();

	/**
	 * Release borrowed references without destroying their owners.
	 * Call outside rendering; use() restores enclosing scopes automatically.
	 * @returns {Draw} this
	 */
	reset = () => {
		this.buffer = null;
		this.viewpoint = null;

		return this;
	}

	/**
	 * Run synchronous drawing with a borrowed destination and viewpoint.
	 * Nested calls restore both references in finally, including after errors.
	 * Async callbacks are unsupported: the scope ends when the callback returns.
	 *
	 * @param {Buffer|null} buffer Drawing destination; null disables drawing.
	 * @param {Object|null} viewpoint Logical-pixel origin for this pass.
	 * @param {Function} callback Synchronous drawing operation; required.
	 * @returns {*} The callback result.
	 * @throws {Error} Propagates callback errors after restoring the prior scope.
	 */
	use = ( buffer, viewpoint, callback ) => {
		const previousBuffer = this.buffer;
		const previousViewpoint = this.viewpoint;
		this.buffer = buffer;
		this.viewpoint = viewpoint;

		try {
			return callback();
		} finally {
			this.buffer = previousBuffer;
			this.viewpoint = previousViewpoint;
		}
	}
}

export default new Draw();
