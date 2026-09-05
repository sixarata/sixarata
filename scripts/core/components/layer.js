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
	 * Configure through set(); Layer ancestry must be acyclic.
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
	 * Changes invalidate ancestor compositions.
	 * @returns {Boolean} Current presentation visibility.
	 * @type {Boolean}
	 */
	get visible() {
		return this.#visible;
	}

	/**
	 * Change presentation visibility and invalidate ancestor compositions.
	 *
	 * @param {Boolean} value Whether this Layer contributes pixels.
	 * @returns {void}
	 */
	set visible( value ) {
		const visible = Boolean( value );

		if ( this.#visible !== visible ) {
			this.#visible = visible;
			if ( this.cache ) {
				this.invalidate( 'visibility' );
			}
		}
	}

	/**
	 * Stored presentation visibility, independent of simulation.
	 * @type {Boolean}
	 */
	#visible = true;

	/**
	 * Whether rendering uses a private Buffer. False draws directly to parent.
	 * Change through set(); direct Layers always render their contents afresh.
	 * @type {Boolean}
	 */
	buffered;

	/**
	 * Owned off-screen surface, or a borrowed destination during direct rendering.
	 * Direct Layers expose null outside their render pass.
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
	 * Reconfiguration and cleanup must occur outside this Layer's render pass.
	 * Changes to member arrays require explicit Cache invalidation. Child Layers
	 * must name this Layer as parent; detached Layer references are ignored.
	 * Cyclic ancestry throws TypeError before altering existing configuration.
	 *
	 * @param {Object|null} parent Destination with a Buffer and optional logical-pixel viewpoint.
	 * @param {String} name Diagnostic layer name.
	 * @param {Array<Array>} groups Ordered collection references.
	 * @param {Boolean} cached Whether unchanged pixels persist between frames.
	 * @param {Boolean} buffered Use a private surface; defaults to true.
	 * @returns {Layer} this
	 * @throws {TypeError} When the requested Layer ancestry contains a cycle.
	 */
	set = (
		parent   = null,
		name     = '',
		groups   = [],
		cached   = true,
		buffered = true
	) => {
		const ancestors = new Set( [ this ] );

		for ( let ancestor = parent; ancestor instanceof Layer; ancestor = ancestor.parent ) {
			if ( ancestors.has( ancestor ) ) {
				throw new TypeError( 'Layer ancestry must be acyclic.' );
			}
			ancestors.add( ancestor );
		}
		this.reset();

		this.parent   = parent;
		this.name     = String( name );
		this.groups   = Array.isArray( groups )
			? groups.filter( Array.isArray )
			: [];
		this.cached   = Boolean( cached );
		this.buffered = Boolean( buffered );
		this.invalidate( 'configured' );

		return this;
	}

	/**
	 * Restore an unowned, unnamed, empty, cacheable presentation layer.
	 *
	 * Existing Buffer resources are released and fresh Cache metadata is
	 * created. Buffer allocation is deferred until resize or rendering. The
	 * viewpoint snapshot starts empty so the first render always builds. Call
	 * outside rendering; child membership and lifetimes remain caller-owned.
	 *
	 * @returns {Layer} this
	 */
	reset = () => {
		if ( this.cache ) {
			this.invalidate( 'reset' );
		}
		if ( this.buffered && this.buffer ) {
			this.buffer.screen.ignore();
			this.buffer.destroy();
		}

		this.parent    = null;
		this.name      = '';
		this.groups    = [];
		this.cached    = true;
		this.#visible  = true;
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
	 * Mark this Layer and its Layer ancestors stale after a presentation change.
	 *
	 * @param {String} reason Concise diagnostic reason for invalidation.
	 * @returns {Layer} this
	 */
	invalidate = ( reason = 'changed' ) => {
		this.cache.invalidate( reason );

		if ( this.parent instanceof Layer ) {
			this.parent.invalidate( reason );
		}

		return this;
	}

	/**
	 * Determine whether this layer needs to redraw its contents.
	 *
	 * Live layers are always stale. Cached viewport layers additionally compare
	 * the shared viewpoint position so scrolling cannot reuse incorrectly offset
	 * pixels. Visible stale descendants also require rebuilding, including live
	 * children beneath cached ancestors. Hidden descendants do not force redraws.
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

		for ( const group of this.groups ) {
			for ( const child of group ) {
				if ( child instanceof Layer && child.parent === this && child.visible && child.stale() ) {
					return true;
				}
			}
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
			this.#renderDirect();
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
			this.#renderDirect();
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
	 * Invalidate ancestor pixels, release the owned Buffer, and sever references.
	 * Referenced child Layers and their collection membership remain caller-owned.
	 * Call outside rendering so active drawing destinations remain valid.
	 *
	 * @returns {void}
	 */
	destroy = () => {
		if ( this.buffered && this.buffer ) {
			this.buffer.screen.ignore();
			this.buffer.destroy();
		}
		this.buffer = null;
		this.invalidate( 'destroyed' );
		this.parent   = null;
		this.groups   = [];
	}

	/**
	 * Resolve the logical viewpoint from the enclosing presentation host.
	 * Layer viewpoint properties are cache snapshots, not camera owners.
	 *
	 * @returns {Object} Host coordinates in logical pixels, defaulting to zero.
	 */
	#position = () => {
		let parent = this.parent;

		while ( parent instanceof Layer ) {
			parent = parent.parent;
		}

		return parent?.viewpoint ?? { x: 0, y: 0, z: 0 };
	}

	/**
	 * Borrow the parent's active destination for child Layers during a pass.
	 * The borrowed reference is restored after success or failure and never owned.
	 *
	 * @returns {void}
	 */
	#renderDirect = () => {
		const buffer = this.buffer;
		this.buffer = this.parent.buffer;

		try {
			this.#renderContents();
		} finally {
			this.buffer = buffer;
		}
	}

	/**
	 * Determine whether the shared viewpoint moved after the last successful build.
	 *
	 * @returns {Boolean} Whether any logical viewpoint coordinate changed.
	 */
	#viewpointChanged = () => {
		const position = this.#position();

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
		const position = this.#position();

		this.viewpoint.x = position.x;
		this.viewpoint.y = position.y;
		this.viewpoint.z = position.z;
	}

	/**
	 * Render configured referenced collections in their declared order.
	 *
	 * Each group snapshots its starting members. Removed members are skipped,
	 * additions wait until the next pass, and changed membership invalidates
	 * cached pixels. Sparse entries and nonrenderable data are ignored. Renderers
	 * resolve the active parent Buffer through their own intrinsic destination.
	 *
	 * @returns {void}
	 */
	#renderContents = () => {
		for ( const contents of this.groups ) {
			const members = contents.slice();

			try {
				for ( let i = 0; i < members.length; i++ ) {
					const member = members[ i ];

					if (
						typeof member?.render === 'function'
						&&
						( ! ( member instanceof Layer ) || member.parent === this )
						&&
						( contents[ i ] === member || contents.includes( member ) )
					) {
						member.render();
					}
				}
			} finally {
				if (
					contents.length !== members.length
					||
					members.some( ( member, index ) => contents[ index ] !== member )
				) {
					this.invalidate( 'membership' );
				}
			}
		}
	}
}
