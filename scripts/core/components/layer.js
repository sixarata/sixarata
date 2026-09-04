import Cache from '../utilities/cache.js';
import Buffer from './buffer.js';

/**
 * One ordered presentation layer owned by a Room.
 *
 * A Layer groups existing Room tile collections without changing their
 * simulation or collision behavior. It renders those Tiles into an intrinsic
 * off-screen Buffer and composites that Buffer into its Room. Cached layers
 * rebuild after source, viewport, or Camera changes; live layers rebuild every
 * frame.
 */
export default class Layer {

	/**
	 * Room that owns this presentation layer.
	 *
	 * @type {Room|null}
	 */
	room;

	/**
	 * Concise diagnostic name for this layer.
	 *
	 * @type {String}
	 */
	name;

	/**
	 * Ordered Room tile-group names rendered by this layer.
	 *
	 * @type {Array<String>}
	 */
	groups;

	/**
	 * Whether unchanged pixels may be reused between frames.
	 *
	 * @type {Boolean}
	 */
	cached;

	/**
	 * Off-screen drawing surface owned by this layer.
	 *
	 * @type {Buffer}
	 */
	buffer;

	/**
	 * Freshness metadata for the derived pixels in buffer.
	 *
	 * @type {Cache}
	 */
	cache;

	/**
	 * Camera coordinates represented by the current buffered pixels.
	 *
	 * @type {Object}
	 */
	camera;

	/**
	 * Construct a Room presentation layer.
	 *
	 * @param {Room|null} room Room that owns the layer and its output Buffer.
	 * @param {String} name Diagnostic layer name.
	 * @param {Array<String>} groups Ordered Room tile-group names.
	 * @param {Boolean} cached Whether unchanged pixels persist between frames.
	 * @returns {Layer} this
	 */
	constructor(
		room   = null,
		name   = '',
		groups = [],
		cached = true
	) {
		return this.set( room, name, groups, cached );
	}

	/**
	 * Configure this layer after restoring its complete default state.
	 *
	 * Group names are copied so external array mutations cannot silently change
	 * layer membership without invalidating its Cache.
	 *
	 * @param {Room|null} room Room that owns the layer and its output Buffer.
	 * @param {String} name Diagnostic layer name.
	 * @param {Array<String>} groups Ordered Room tile-group names.
	 * @param {Boolean} cached Whether unchanged pixels persist between frames.
	 * @returns {Layer} this
	 */
	set = (
		room   = null,
		name   = '',
		groups = [],
		cached = true
	) => {
		this.reset();

		this.room   = room;
		this.name   = String( name );
		this.groups = Array.isArray( groups )
			? [ ...groups ]
			: [];
		this.cached = Boolean( cached );

		return this;
	}

	/**
	 * Restore an unowned, unnamed, empty, cacheable presentation layer.
	 *
	 * Existing Buffer resources are released before a clean Buffer and Cache are
	 * created. The Camera snapshot starts empty so the first render always builds.
	 *
	 * @returns {Layer} this
	 */
	reset = () => {
		if ( this.buffer ) {
			this.buffer.screen.ignore();
			this.buffer.destroy();
		}

		this.room   = null;
		this.name   = '';
		this.groups = [];
		this.cached = true;
		this.buffer = new Buffer();
		this.cache  = new Cache();
		this.camera = {
			x: null,
			y: null,
			z: null,
		};

		return this;
	}

	/**
	 * Determine whether this layer owns a specific Room tile collection.
	 *
	 * @param {Array} group Existing Room tile collection.
	 * @returns {Boolean} Whether one configured group name resolves to the array.
	 */
	has = ( group = [] ) => {
		if ( ! this.room?.tiles ) {
			return false;
		}

		return this.groups.some( name => this.room.tiles[ name ] === group );
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
	 * Determine whether this layer needs to redraw its Tiles.
	 *
	 * Live layers are always stale. Cached viewport layers additionally compare
	 * the shared Camera position so scrolling cannot reuse incorrectly offset
	 * pixels.
	 *
	 * @returns {Boolean} Whether the layer Buffer must be rebuilt.
	 */
	stale = () => {
		if ( ! this.cached ) {
			return true;
		}

		if ( this.#cameraChanged() && ! this.cache.dirty ) {
			this.invalidate( 'camera' );
		}

		return this.cache.stale();
	}

	/**
	 * Draw this layer when stale and composite it into the owning Room Buffer.
	 *
	 * The Room Buffer remains the intrinsic Tile drawing destination while a
	 * rebuild is active; it is restored before the layer is composited.
	 *
	 * @returns {Layer} this
	 */
	render = () => {
		if ( ! this.room?.buffer ) {
			return this;
		}

		if ( this.stale() ) {
			this.rebuild();
		}

		this.room.buffer.context.globalAlpha = 1;
		this.buffer.put( this.room.buffer );

		return this;
	}

	/**
	 * Rebuild this layer from its current Room tile collections.
	 *
	 * Validation uses the revision captured before drawing so a synchronous
	 * invalidation raised by a Tile hook keeps the result stale for the next frame.
	 *
	 * @returns {Layer} this
	 */
	rebuild = () => {
		if ( ! this.room?.buffer ) {
			return this;
		}

		const output = this.room.buffer;
		const revision = this.cache.revision;

		this.buffer.update();
		this.room.buffer = this.buffer;

		try {
			this.#renderTiles();
		} finally {
			this.room.buffer = output;
		}

		this.#captureCamera();
		this.cache.validate( revision );

		return this;
	}

	/**
	 * Release the owned Buffer and sever Room and group references.
	 *
	 * @returns {void}
	 */
	destroy = () => {
		this.buffer.screen.ignore();
		this.buffer.destroy();
		this.room   = null;
		this.groups = [];
	}

	/**
	 * Determine whether the shared Camera moved after the last successful build.
	 *
	 * @returns {Boolean} Whether any logical Camera coordinate changed.
	 */
	#cameraChanged = () => {
		const position = this.room?.viewpoint ?? { x: 0, y: 0, z: 0 };

		return (
			this.camera.x !== position.x
			||
			this.camera.y !== position.y
			||
			this.camera.z !== position.z
		);
	}

	/**
	 * Capture the logical Camera coordinates represented by buffered pixels.
	 *
	 * @returns {void}
	 */
	#captureCamera = () => {
		const position = this.room?.viewpoint ?? { x: 0, y: 0, z: 0 };

		this.camera.x = position.x;
		this.camera.y = position.y;
		this.camera.z = position.z;
	}

	/**
	 * Render configured Room tile groups in their declared order.
	 *
	 * Missing groups and sparse entries are ignored. Tile rendering remains
	 * intrinsic because each Tile resolves the temporarily active Room Buffer.
	 *
	 * @returns {void}
	 */
	#renderTiles = () => {
		for ( const name of this.groups ) {
			const tiles = this.room.tiles?.[ name ] ?? [];
			const length = tiles.length;

			for ( let i = 0; i < length; i++ ) {
				tiles[ i ]?.render?.();
			}
		}
	}
}
