import Time from './time.js';

/**
 * Track the validity of derived engine state.
 *
 * Cache deliberately owns freshness metadata rather than cached values. The
 * consumer continues to own its Buffer, path, generated asset, or other derived
 * result. Revisions distinguish successive source changes, while timestamps and
 * reasons make invalidation observable during development and profiling.
 */
export default class Cache {

	/** @type {Boolean} Whether the derived result must be rebuilt. */
	dirty = true;

	/** @type {Number} Latest safe-integer source generation. */
	revision = 0;

	/** @type {Number} Source revision represented by the derived result. */
	built = -1;

	/** @type {Number} Shared monotonic millisecond time of invalidation. */
	changedAt = 0;

	/** @type {Number|null} Shared monotonic millisecond time of validation. */
	builtAt = null;

	/** @type {String} Most recent diagnostic invalidation reason. */
	reason = 'reset';

	/**
	 * Construct an invalid Cache that requires its first build.
	 *
	 * @returns {Cache} this
	 */
	constructor() {
		return this.set();
	}

	/**
	 * Set the Cache to its initial invalid state.
	 *
	 * @returns {Cache} this
	 */
	set = () => this.reset();

	/**
	 * Reset all freshness, revision, timing, and diagnostic state.
	 *
	 * A reset Cache is dirty because no derived result has been validated for
	 * its initial revision. Times use the shared monotonic engine clock in
	 * milliseconds.
	 *
	 * @returns {Cache} this
	 */
	reset = () => {
		this.dirty     = true;
		this.revision  = 0;
		this.built     = -1;
		this.changedAt = Time.now;
		this.builtAt   = null;
		this.reason    = 'reset';

		return this;
	}

	/**
	 * Mark the derived result stale after a source change.
	 *
	 * Every invalidation advances the revision, including changes coalesced
	 * before the next rebuild. Safe-integer rollover also invalidates the stored
	 * revision so equality cannot accidentally describe stale state as current.
	 *
	 * @param {String} reason Concise diagnostic reason for the invalidation.
	 * @returns {Cache} this
	 */
	invalidate = (
		reason = 'changed'
	) => {
		if ( this.revision >= Number.MAX_SAFE_INTEGER ) {
			this.revision = 0;
		}
		this.revision++;

		this.dirty     = true;
		this.changedAt = Time.now;
		this.reason    = String( reason ?? '' );

		return this;
	}

	/**
	 * Mark a derived result current for one captured source revision.
	 *
	 * Supplying the revision captured before asynchronous work began prevents a
	 * late result from validating after a newer source change. Omitting it marks
	 * synchronous work current for the latest revision.
	 *
	 * @param {Number} revision Source revision used to build the derived result.
	 * @returns {Boolean} Whether that revision was current and is now validated.
	 */
	validate = (
		revision = this.revision
	) => {
		if ( revision !== this.revision ) {
			return false;
		}

		this.dirty   = false;
		this.built   = revision;
		this.builtAt = Time.now;

		return true;
	}

	/**
	 * Determine whether the derived result matches the latest source revision.
	 *
	 * @returns {Boolean} Whether callers may reuse the cached result.
	 */
	valid = () => (
		! this.dirty
		&&
		this.built === this.revision
	);

	/**
	 * Determine whether the derived result needs to be rebuilt.
	 *
	 * @returns {Boolean} Whether the Cache is dirty or its revisions differ.
	 */
	stale = () => ! this.valid();
}
