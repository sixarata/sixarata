import Cache from '../utilities/cache.js';
import Buffer from './buffer.js';

/**
 * One ordered presentation layer owned by a parent.
 *
 * Collections retain their simulation ownership. Members with a render method
 * draw through their intrinsic destination, which must resolve parent.buffer.
 * Other members are ignored. Buffered drawing temporarily activates this Layer's
 * surface on the parent and restores it even after failure. Direct drawing uses
 * the parent's current surface. Visibility never controls simulation.
 */
export default class Layer {

	/**
	 * Parent exposing the active drawing Buffer and optional viewpoint.
	 *
	 * @type {Object|null}
	 */
	parent;

	/**
	 * Concise diagnostic name for this layer.
	 *
	 * @type {String}
	 */
	name;

	/**
	 * Ordered collection references rendered by this layer.
	 *
	 * @type {Array<Array>}
	 */
	groups;

	/**
	 * Whether unchanged pixels may be reused between frames.
	 *
	 * @type {Boolean}
	 */
	cached;

	/**
	 * Whether this Layer contributes pixels; hiding it does not affect simulation.
	 * @type {Boolean}
	 */
	visible;

	/**
	 * Whether rendering uses a private Buffer. False draws directly to parent.
	 * Change through set(); direct Layers always render their contents afresh.
	 * @type {Boolean}
	 */
	buffered;

	/**
	 * Off-screen drawing surface owned by this layer.
	 *
	 * @type {Buffer|null}
	 */
	buffer;

	/**
	 * Freshness metadata for the derived pixels in buffer.
	 *
	 * @type {Cache}
	 */
	cache;

	/**
	 * Viewpoint coordinates represented by the current buffered pixels.
	 *
	 * @type {Object}
	 */
	viewpoint;

	/**
	 * Construct an ordered presentation layer.
	 *
	 * @param {Object|null} parent Destination with a Buffer and optional logical-pixel viewpoint.
	 * @param {String} name Diagnostic layer name.
	 * @param {Array<Array>} groups Ordered collection references.
	 * @param {Boolean} cached Whether unchanged pixels persist between frames.
	 * @param {Boolean} buffered Use a private surface; defaults to true.
	 * @returns {Layer} this
	 */
	constructor(
		parent   = null,
		name     = '',
		groups   = [],
		cached   = true,
		buffered = true
	) {
		return this.set( parent, name, groups, cached, buffered );
	}

	/**
	 * Configure this layer after restoring its complete default state.
	 *
	 * The outer collection list is copied; member arrays retain their identities.
	 * Changes to member arrays require explicit Cache invalidation.
	 *
	 * @param {Object|null} parent Destination with a Buffer and optional logical-pixel viewpoint.
	 * @param {String} name Diagnostic layer name.
	 * @param {Array<Array>} groups Ordered collection references.
	 * @param {Boolean} cached Whether unchanged pixels persist between frames.
	 * @param {Boolean} buffered Use a private surface; defaults to true.
	 * @returns {Layer} this
	 */
	set = (
		parent   = null,
		name     = '',
		groups   = [],
		cached   = true,
		buffered = true
	) => {
		this.reset();

		this.parent   = parent;
		this.name     = String( name );
		this.groups   = Array.isArray( groups )
			? groups.filter( Array.isArray )
			: [];
		this.cached   = Boolean( cached );
		this.buffered = Boolean( buffered );

		return this;
	}

	/**
	 * Restore an unowned, unnamed, empty, cacheable presentation layer.
	 *
	 * Existing Buffer resources are released and fresh Cache metadata is
	 * created. Buffer allocation is deferred until resize or rendering. The
	 * viewpoint snapshot starts empty so the first render always builds.
	 *
	 * @returns {Layer} this
	 */
	reset = () => {
		if ( this.buffer ) {
			this.buffer.screen.ignore();
			this.buffer.destroy();
		}

		this.parent    = null;
		this.name      = '';
		this.groups    = [];
		this.cached    = true;
		this.visible   = true;
		this.buffered  = true;
		this.buffer    = null;
		this.cache     = new Cache();
		this.viewpoint = {
			x: null,
			y: null,
			z: null,
		};

		return this;
	}

	/**
	 * Determine whether this layer references a collection.
	 *
	 * @param {Array} group Collection to locate by identity.
	 * @returns {Boolean} Whether the collection is included.
	 */
	has = ( group = [] ) => {
		return this.groups.includes( group );
	}

	/**
	 * Resize the off-screen Buffer to logical viewport dimensions.
	 *
	 * A changed width, height, or depth invalidates cached pixels. Device pixel
	 * ratio remains owned by Buffer and Screen.
	 *
	 * @param {Object} size Logical pixel width, height, and depth.
	 * @returns {Layer} this
	 */
	resize = ( size = { w: 0, h: 0, d: 0 } ) => {
		if ( ! this.buffered ) {
			return this;
		}
		this.buffer ??= new Buffer();
		const changed = (
			( this.buffer.size?.w ?? 0 ) !== ( size.w ?? 0 )
			||
			( this.buffer.size?.h ?? 0 ) !== ( size.h ?? 0 )
			||
			( this.buffer.size?.d ?? 0 ) !== ( size.d ?? 0 )
		);

		this.buffer.resize( size );

		if ( changed ) {
			this.invalidate( 'resize' );
		}

		return this;
	}

	/**
	 * Mark this layer's derived pixels stale after a presentation change.
	 *
	 * @param {String} reason Concise diagnostic reason for invalidation.
	 * @returns {Layer} this
	 */
	invalidate = ( reason = 'changed' ) => {
		this.cache.invalidate( reason );

		return this;
	}

	/**
	 * Determine whether this layer needs to redraw its contents.
	 *
	 * Live layers are always stale. Cached viewport layers additionally compare
	 * the shared viewpoint position so scrolling cannot reuse incorrectly offset
	 * pixels.
	 *
	 * @returns {Boolean} Whether the layer Buffer must be rebuilt.
	 */
	stale = () => {
		if ( ! this.cached || ! this.buffered ) {
			return true;
		}

		if ( this.#viewpointChanged() && ! this.cache.dirty ) {
			this.invalidate( 'viewpoint' );
		}

		return this.cache.stale();
	}

	/**
	 * Draw this layer when stale and composite it into the owning parent Buffer.
	 *
	 * Hidden or unbound Layers are inert. Direct Layers redraw every call.
	 * Buffered Layers temporarily activate their surface on the parent while
	 * rebuilding, then restore the destination before compositing.
	 *
	 * @returns {Layer} this
	 */
	render = () => {
		if ( ! this.visible || ! this.parent?.buffer ) {
			return this;
		}

		if ( ! this.buffered ) {
			this.#renderContents();
			return this;
		}
		this.resize( this.parent.buffer.size );

		if ( this.stale() ) {
			this.rebuild();
		}

		this.parent.buffer.context.globalAlpha = 1;
		this.buffer.put( this.parent.buffer );

		return this;
	}

	/**
	 * Rebuild this layer from its referenced collections.
	 *
	 * Validation uses the revision captured before drawing so a synchronous
	 * invalidation raised by a render callback keeps the result stale for the next frame.
	 *
	 * @returns {Layer} this
	 */
	rebuild = () => {
		if ( ! this.parent?.buffer ) {
			return this;
		}
		if ( ! this.buffered ) {
			this.#renderContents();
			return this;
		}
		this.resize( this.parent.buffer.size );

		const output = this.parent.buffer;
		const revision = this.cache.revision;
		// Failed or interrupted builds must never leave reusable partial pixels.
		this.cache.dirty = true;

		this.buffer.update();
		this.parent.buffer = this.buffer;

		try {
			this.#renderContents();
		} finally {
			this.parent.buffer = output;
		}

		this.#captureViewpoint();
		this.cache.validate( revision );

		return this;
	}

	/**
	 * Release the owned Buffer and sever parent and group references.
	 *
	 * @returns {void}
	 */
	destroy = () => {
		if ( this.buffer ) {
			this.buffer.screen.ignore();
			this.buffer.destroy();
		}
		this.buffer = null;
		this.cache.invalidate( 'destroyed' );
		this.parent   = null;
		this.groups   = [];
	}

	/**
	 * Determine whether the shared viewpoint moved after the last successful build.
	 *
	 * @returns {Boolean} Whether any logical viewpoint coordinate changed.
	 */
	#viewpointChanged = () => {
		const position = this.parent?.viewpoint ?? { x: 0, y: 0, z: 0 };

		return (
			this.viewpoint.x !== position.x
			||
			this.viewpoint.y !== position.y
			||
			this.viewpoint.z !== position.z
		);
	}

	/**
	 * Capture the logical Viewpoint coordinates represented by buffered pixels.
	 *
	 * @returns {void}
	 */
	#captureViewpoint = () => {
		const position = this.parent?.viewpoint ?? { x: 0, y: 0, z: 0 };

		this.viewpoint.x = position.x;
		this.viewpoint.y = position.y;
		this.viewpoint.z = position.z;
	}

	/**
	 * Render configured referenced collections in their declared order.
	 *
	 * Sparse entries and nonrenderable data are ignored. Renderers resolve the
	 * temporarily active parent Buffer through their own intrinsic destination.
	 *
	 * @returns {void}
	 */
	#renderContents = () => {
		for ( const contents of this.groups ) {
			const length = contents.length;

			for ( let i = 0; i < length; i++ ) {
				if ( typeof contents[ i ]?.render === 'function' ) {
					contents[ i ].render();
				}
			}
		}
	}
}
