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
	 * Immediate Layer parent or root drawing host, managed through membership.
	 * Root hosts are configured by set(); Layer parents are assigned by add().
	 *
	 * @type {Object|null}
	 * @returns {Object|null} Current destination owner, or null when detached.
	 */
	get parent() {
		return this.#parent;
	}

	/**
	 * Stored drawing host or managed Layer parent.
	 * @type {Object|null}
	 */
	#parent = null;

	/**
	 * Snapshot of ordered child Layers. Editing it cannot alter membership.
	 * Own content groups render before these children.
	 *
	 * @type {Array<Layer>}
	 * @returns {Array<Layer>} Children in presentation order.
	 */
	get children() {
		return this.#children.slice();
	}

	/**
	 * Authoritative ordered child membership, changed only by add/remove.
	 * @type {Array<Layer>}
	 */
	#children = [];

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
	 * Construct an ordered presentation Layer, optionally bound to a root host.
	 * Layer children are attached afterward through add().
	 *
	 * @param {Object|null} host Root destination with a Buffer and optional logical-pixel viewpoint; not a Layer.
	 * @param {String} name Diagnostic layer name.
	 * @param {Array<Array>} groups Ordered collection references.
	 * @param {Boolean} cached Whether unchanged pixels persist between frames.
	 * @param {Boolean} buffered Use a private surface; defaults to true.
	 * @returns {Layer} this
	 * @throws {TypeError} When host is a Layer; use add() for child membership.
	 */
	constructor(
		host     = null,
		name     = '',
		groups   = [],
		cached   = true,
		buffered = true
	) {
		return this.set( host, name, groups, cached, buffered );
	}

	/**
	 * Configure this layer after restoring its complete default state.
	 *
	 * The outer collection list is copied; member arrays retain their identities.
	 * Reconfiguration and cleanup must occur outside this Layer's render pass.
	 * Changes to member arrays require explicit Cache invalidation. Layer children
	 * must be attached through add(); Layer references in groups are ignored.
	 * Reconfiguration detaches this Layer and its children without destroying them.
	 *
	 * @param {Object|null} host Root destination with a Buffer and optional logical-pixel viewpoint; not a Layer.
	 * @param {String} name Diagnostic layer name.
	 * @param {Array<Array>} groups Ordered collection references.
	 * @param {Boolean} cached Whether unchanged pixels persist between frames.
	 * @param {Boolean} buffered Use a private surface; defaults to true.
	 * @returns {Layer} this
	 * @throws {TypeError} When host is a Layer; membership must use add().
	 */
	set = (
		host     = null,
		name     = '',
		groups   = [],
		cached   = true,
		buffered = true
	) => {
		if ( host instanceof Layer ) {
			throw new TypeError( 'Use Layer.add() to attach a child.' );
		}
		this.reset();

		this.#parent  = host;
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
	 * outside rendering; existing children are detached without destruction.
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

		this.#detach();
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
	 * Append a child Layer, moving it from its previous Layer parent if needed.
	 *
	 * Duplicate adds are inert and preserve order. Invalid input and cycles are
	 * rejected before mutation. Both old and new compositions are invalidated.
	 * Child buffers, content groups, and simulation membership are retained.
	 *
	 * @param {Layer} child Layer to attach; required.
	 * @returns {Layer} this, for chained membership additions.
	 * @throws {TypeError} When child is not a Layer or would create a cycle.
	 */
	add = child => {
		if ( ! ( child instanceof Layer ) ) {
			throw new TypeError( 'Layer children must be Layers.' );
		}

		for ( let ancestor = this; ancestor instanceof Layer; ancestor = ancestor.parent ) {
			if ( ancestor === child ) {
				throw new TypeError( 'Layer ancestry must be acyclic.' );
			}
		}
		if ( child.parent === this ) {
			return this;
		}
		if ( child.parent instanceof Layer ) {
			child.parent.remove( child );
		}
		this.#children.push( child );
		child.#parent = this;
		child.invalidate( 'attached' );

		return this;
	}

	/**
	 * Detach a child while preserving sibling order and the child's resources.
	 *
	 * Detachment invalidates the old composition and the child's cached pixels.
	 * It does not destroy descendants or change any simulation collection.
	 *
	 * @param {Layer} child Child to detach; missing or unrelated values are inert.
	 * @returns {Boolean} Whether this Layer contained and detached the child.
	 */
	remove = child => {
		const index = this.#children.indexOf( child );

		if ( index < 0 ) {
			return false;
		}
		child.invalidate( 'detached' );
		this.#children.splice( index, 1 );
		child.#parent = null;

		return true;
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

		for ( const child of this.#children ) {
			if ( child.visible && child.stale() ) {
				return true;
			}
		}

		return this.cache.stale();
	}

	/**
	 * Draw this layer when stale and composite it into the owning parent Buffer.
	 *
	 * Hidden or unbound Layers are inert. Direct Layers redraw every call.
	 * Buffered Layers temporarily activate their surface on the parent while
	 * rebuilding, then restore the destination before compositing. Children moved
	 * or detached during rebuilding do not composite into their old destination.
	 *
	 * @returns {Layer} this
	 */
	render = () => {
		const parent = this.parent;

		if ( ! this.visible || ! parent?.buffer ) {
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

		if ( this.parent === parent ) {
			parent.buffer.context.globalAlpha = 1;
			this.buffer.put( parent.buffer );
		}

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
		const parent = this.parent;

		if ( ! parent?.buffer ) {
			return this;
		}
		if ( ! this.buffered ) {
			this.#renderDirect();
			return this;
		}
		this.resize( this.parent.buffer.size );

		const output = parent.buffer;
		const revision = this.cache.revision;
		// Failed or interrupted builds must never leave reusable partial pixels.
		this.cache.dirty = true;

		this.buffer.update();
		parent.buffer = this.buffer;

		try {
			this.#renderContents();
		} finally {
			parent.buffer = output;
		}

		this.#captureViewpoint();
		this.cache.validate( revision );

		return this;
	}

	/**
	 * Invalidate ancestor pixels, release the owned Buffer, and sever references.
	 * This Layer and its children are detached; child resources remain reusable.
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
		this.#detach();
		this.groups   = [];
	}

	/**
	 * Sever managed links during reset or destruction without destroying children.
	 * Root hosts have no Layer membership to release.
	 *
	 * @returns {void}
	 */
	#detach = () => {
		if ( this.parent instanceof Layer ) {
			this.parent.remove( this );
		}
		this.#parent = null;

		for ( const child of this.#children.slice() ) {
			this.remove( child );
		}
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
	 * Render content groups, then managed children in their declared order.
	 *
	 * Each group snapshots its starting members. Removed members are skipped,
	 * additions wait until the next pass, and changed membership invalidates
	 * cached pixels. Sparse entries and nonrenderable data are ignored. Renderers
	 * resolve the active parent Buffer through their own intrinsic destination.
	 * Children snapshot at pass start; detached children are skipped and newly
	 * attached children wait until the next pass.
	 *
	 * @returns {void}
	 */
	#renderContents = () => {
		const children = this.#children.slice();

		for ( const contents of this.groups ) {
			const members = contents.slice();

			try {
				for ( let i = 0; i < members.length; i++ ) {
					const member = members[ i ];

					if (
						typeof member?.render === 'function'
						&&
						! ( member instanceof Layer )
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
		for ( const child of children ) {
			if ( child.parent === this ) {
				child.render();
			}
		}
	}
}
