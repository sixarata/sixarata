import Cache from '../utilities/cache.js';
import Draw from '../utilities/draw.js';
import Buffer from './buffer.js';

/**
 * One ordered presentation layer owned by a parent.
 *
 * Collections retain their simulation ownership. Members with a render method
 * draw through the shared Draw scope for this pass.
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
	 * Snapshot of ordered Layers and live collection references. Editing this
	 * outer array cannot alter presentation membership; collections remain live.
	 *
	 * @type {Array<Layer|Array>}
	 * @returns {Array<Layer|Array>} Children in presentation order.
	 */
	get children() {
		return this.#children.slice();
	}

	/**
	 * Authoritative ordered child membership, changed only by add/remove.
	 * @type {Array<Layer|Array>}
	 */
	#children = [];

	/**
	 * Concise diagnostic name for this layer.
	 *
	 * @type {String}
	 */
	name;

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
	 * Initial children use the same managed membership as add().
	 *
	 * @param {Object|null} host Root destination with a Buffer and optional logical-pixel viewpoint; not a Layer.
	 * @param {String} name Diagnostic layer name.
	 * @param {Array<Layer|Array>} children Ordered child Layers and collection references; defaults to empty.
	 * @param {Boolean} cached Whether unchanged pixels persist between frames.
	 * @param {Boolean} buffered Use a private surface; defaults to true.
	 * @returns {Layer} this
	 * @throws {TypeError} When host is a Layer or initial children are invalid.
	 */
	constructor(
		host     = null,
		name     = '',
		children = [],
		cached   = true,
		buffered = true
	) {
		return this.set( host, name, children, cached, buffered );
	}

	/**
	 * Configure this layer after restoring its complete default state.
	 *
	 * The outer child list is copied; referenced collections retain their identities.
	 * Reconfiguration and cleanup must occur outside this Layer's render pass.
	 * Changes to collection members require explicit Cache invalidation outside
	 * rendering. Initial children are validated before existing state is changed.
	 * Reconfiguration detaches this Layer and its children without destroying them.
	 *
	 * @param {Object|null} host Root destination with a Buffer and optional logical-pixel viewpoint; not a Layer.
	 * @param {String} name Diagnostic layer name.
	 * @param {Array<Layer|Array>} children Ordered child Layers and collection references; defaults to empty.
	 * @param {Boolean} cached Whether unchanged pixels persist between frames.
	 * @param {Boolean} buffered Use a private surface; defaults to true.
	 * @returns {Layer} this
	 * @throws {TypeError} When host is a Layer or initial children are invalid or cyclic.
	 */
	set = (
		host     = null,
		name     = '',
		children = [],
		cached   = true,
		buffered = true
	) => {
		if ( host instanceof Layer ) {
			throw new TypeError( 'Use Layer.add() to attach a child.' );
		}
		if ( ! Array.isArray( children ) ) {
			throw new TypeError( 'Layer children must be an array.' );
		}
		const contents = children.slice();
		for ( const child of contents ) {
			this.#check( child );
		}
		this.reset();

		this.#parent  = host;
		this.name     = String( name );
		this.cached   = Boolean( cached );
		this.buffered = Boolean( buffered );
		for ( const child of contents ) {
			this.add( child );
		}
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
	 * Append a Layer or live collection reference to the presentation order.
	 *
	 * Duplicate adds are inert and preserve order. Invalid input and cycles are
	 * rejected before mutation. Both old and new compositions are invalidated.
	 * Layers move from their old parent. Collections may be shared by multiple
	 * Layers; their members and lifecycle are never changed by attachment.
	 *
	 * @param {Layer|Array} child Layer or collection to attach; required.
	 * @returns {Layer} this, for chained membership additions.
	 * @throws {TypeError} When child is neither a Layer nor an array, or creates a cycle.
	 */
	add = child => {
		this.#check( child );
		if ( this.has( child ) ) {
			return this;
		}
		if ( child instanceof Layer && child.parent instanceof Layer ) {
			child.parent.remove( child );
		}
		this.#children.push( child );
		if ( child instanceof Layer ) {
			child.#parent = this;
			child.invalidate( 'attached' );
		} else {
			this.invalidate( 'attached' );
		}

		return this;
	}

	/**
	 * Detach a child while preserving sibling order and the child's resources.
	 *
	 * Detachment invalidates the old composition and, for Layers, the child's pixels.
	 * It does not destroy descendants or change any simulation collection.
	 *
	 * @param {Layer|Array} child Entry to detach; missing or unrelated values are inert.
	 * @returns {Boolean} Whether this Layer contained and detached the child.
	 */
	remove = child => {
		const index = this.#children.indexOf( child );

		if ( index < 0 ) {
			return false;
		}
		if ( child instanceof Layer ) {
			child.invalidate( 'detached' );
			child.#parent = null;
		} else {
			this.invalidate( 'detached' );
		}
		this.#children.splice( index, 1 );

		return true;
	}

	/**
	 * Determine whether a Layer or collection is directly attached.
	 *
	 * @param {Layer|Array} child Entry to locate by identity.
	 * @returns {Boolean} Whether the entry is included; missing values return false.
	 */
	has = child => {
		return this.#children.includes( child );
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
			if ( child instanceof Layer && child.visible && child.stale() ) {
				return true;
			}
		}

		return this.cache.stale();
	}

	/**
	 * Draw this layer when stale and composite it into the owning parent Buffer.
	 *
	 * Hidden Layers or passes without a destination are inert. An explicit host
	 * supplies the destination; otherwise the enclosing Draw scope supplies it.
	 * Direct Layers redraw every call.
	 * Buffered Layers temporarily activate their surface on the parent while
	 * rebuilding, then restore the destination before compositing. Children moved
	 * or detached during rebuilding do not composite into their old destination.
	 *
	 * @returns {Layer} this
	 */
	render = () => {
		const parent = this.parent;
		const output = parent?.buffer ?? Draw.buffer;

		if ( ! this.visible || ! output ) {
			return this;
		}

		if ( ! this.buffered ) {
			this.#renderDirect();
			return this;
		}
		this.resize( output.size );

		if ( this.stale() ) {
			this.rebuild();
		}

		if ( this.parent === parent ) {
			output.context.globalAlpha = 1;
			this.buffer.put( output );
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
		const output = parent?.buffer ?? Draw.buffer;

		if ( ! output ) {
			return this;
		}
		if ( ! this.buffered ) {
			this.#renderDirect();
			return this;
		}
		this.resize( output.size );

		const revision = this.cache.revision;
		// Failed or interrupted builds must never leave reusable partial pixels.
		this.cache.dirty = true;

		this.buffer.update();
		if ( parent ) {
			parent.buffer = this.buffer;
		}

		try {
			Draw.use( this.buffer, this.#position(), this.#renderContents );
		} finally {
			if ( parent ) {
				parent.buffer = output;
			}
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
	}

	/**
	 * Validate a child before changing membership or configuration.
	 * Collections are leaves: only directly attached Layers form tree edges.
	 *
	 * @param {Layer|Array} child Proposed Layer or referenced collection.
	 * @returns {void}
	 * @throws {TypeError} When child is unsupported or introduces a Layer cycle.
	 */
	#check = child => {
		if ( Array.isArray( child ) ) {
			return;
		}
		if ( ! ( child instanceof Layer ) ) {
			throw new TypeError( 'Layer children must be Layers or arrays.' );
		}
		for ( let ancestor = this; ancestor instanceof Layer; ancestor = ancestor.parent ) {
			if ( ancestor === child ) {
				throw new TypeError( 'Layer ancestry must be acyclic.' );
			}
		}
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
	 * Layer viewpoint properties are cache snapshots, not camera owners. An
	 * enclosing Draw scope supplies the viewpoint when no host overrides it.
	 *
	 * @returns {Object} Host coordinates in logical pixels, defaulting to zero.
	 */
	#position = () => {
		let parent = this.parent;

		while ( parent instanceof Layer ) {
			parent = parent.parent;
		}

		return parent?.viewpoint ?? Draw.viewpoint ?? { x: 0, y: 0, z: 0 };
	}

	/**
	 * Borrow the parent's active destination for child Layers during a pass.
	 * The borrowed reference is restored after success or failure and never owned.
	 *
	 * @returns {void}
	 */
	#renderDirect = () => {
		const buffer = this.buffer;
		this.buffer = this.parent?.buffer ?? Draw.buffer;

		try {
			Draw.use( this.buffer, this.#position(), this.#renderContents );
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
	 * Render Layers and referenced collections in their shared presentation order.
	 * Children snapshot at pass start; removed entries are skipped and new entries
	 * wait for the next pass. Collections retain their own membership lifecycle.
	 *
	 * @returns {void}
	 */
	#renderContents = () => {
		const children = this.#children.slice();

		for ( let i = 0; i < children.length; i++ ) {
			const child = children[ i ];

			if ( this.#children[ i ] !== child && ! this.has( child ) ) {
				continue;
			}
			if ( child instanceof Layer ) {
				child.render();
			} else {
				this.#renderCollection( child );
			}
		}
	}

	/**
	 * Render surviving starting members of a live collection.
	 * Additions wait for its next pass. Membership changes invalidate cached
	 * pixels, including after failure. Sparse entries, data, nested arrays, and
	 * unmanaged Layer references are ignored. Renderers use their intrinsic
	 * destination. Removing this collection stops its remaining callbacks.
	 *
	 * @param {Array} contents Referenced collection; never owned or emptied here.
	 * @returns {void}
	 */
	#renderCollection = contents => {
		const members = contents.slice();

		try {
			for ( let i = 0; i < members.length; i++ ) {
				const member = members[ i ];

				if ( ! this.has( contents ) ) {
					break;
				}
				if (
					typeof member?.render === 'function'
					&&
					! ( member instanceof Layer )
					&&
					! Array.isArray( member )
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
