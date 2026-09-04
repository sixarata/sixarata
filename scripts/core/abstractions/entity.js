/**
 * The Entity object.
 *
 * Entity is the minimal lifecycle base for objects that belong to an engine
 * collection. It owns semantic type and state, but deliberately knows nothing
 * about rendering, coordinates, collision, or physics. Spatial objects add
 * those responsibilities in subclasses such as Tile.
 */
export default class Entity {

	/**
	 * Default semantic values for an unconfigured Entity.
	 *
	 * @type {Object}
	 */
	static defaults = {
		type:  'default',
		state: 'static',
	}

	/**
	 * Collection associated with this Entity for membership operations.
	 *
	 * @type {Array}
	 */
	group = [];

	/**
	 * Semantic category used by consumers to distinguish entity kinds.
	 *
	 * @type {String}
	 */
	type = 'default';

	/**
	 * Current lifecycle or behavior state supplied by the concrete entity.
	 *
	 * @type {String}
	 */
	state = 'static';

	/**
	 * Construct and register an Entity.
	 *
	 * @param {Array}  group Owning collection.
	 * @param {String} type Semantic entity category.
	 * @param {String} state Initial lifecycle or behavior state.
	 * @returns {Entity} this
	 */
	constructor(
		group = [],
		type  = Entity.defaults.type,
		state = Entity.defaults.state
	) {
		return this.set( group, type, state );
	}

	/**
	 * Reconfigure and register the Entity with an owning collection.
	 *
	 * Existing collection membership is released before the new values are
	 * applied, so reusing an entity cannot leave stale or duplicate references.
	 *
	 * @param {Array}  group Owning collection.
	 * @param {String} type Semantic entity category.
	 * @param {String} state Initial lifecycle or behavior state.
	 * @returns {Entity} this
	 */
	set = (
		group = [],
		type  = Entity.defaults.type,
		state = Entity.defaults.state
	) => {
		this.reset( group, type, state );
		this.add( this );

		return this;
	}

	/**
	 * Restore Entity values without registering it in the new collection.
	 *
	 * Any previous collection membership is removed. Call add() after reset()
	 * when the entity should immediately rejoin its owning collection.
	 *
	 * @param {Array}  group Owning collection.
	 * @param {String} type Semantic entity category.
	 * @param {String} state Initial lifecycle or behavior state.
	 * @returns {Entity} this
	 */
	reset = (
		group = [],
		type  = Entity.defaults.type,
		state = Entity.defaults.state
	) => {
		return this.configure( group, type, state );
	}

	/**
	 * Apply common Entity values without registering the Entity.
	 *
	 * This protected staging method lets spatial subclasses preserve Sixarata's
	 * arrow-field initialization pattern while sharing Entity configuration.
	 * Existing collection membership is released before values are replaced.
	 *
	 * @protected
	 * @param {Array}  group Owning collection.
	 * @param {String} type Semantic entity category.
	 * @param {String} state Initial lifecycle or behavior state.
	 * @returns {Entity} this
	 */
	configure = (
		group = [],
		type  = Entity.defaults.type,
		state = Entity.defaults.state
	) => {
		this.remove( this );

		this.group = Array.isArray( group )
			? group
			: [];
		this.type  = type;
		this.state = state;

		return this;
	}

	/**
	 * Add an item to the owning collection once.
	 *
	 * @param {*} item Item to register; defaults to this Entity.
	 * @returns {Array} Owning collection after registration.
	 */
	add = ( item = this ) => {
		if ( ! this.group.includes( item ) ) {
			this.group.push( item );
			this.added( item );
		}

		return this.group;
	}

	/**
	 * Respond after an item joins the owning collection.
	 *
	 * Subclasses override this inert lifecycle callback to publish their own
	 * observable events without replacing add().
	 *
	 * @protected
	 * @param {*} item Item that joined the collection.
	 * @returns {void}
	 */
	added = ( item = this ) => {}

	/**
	 * Remove an item from the owning collection without preserving its order.
	 *
	 * Removal may reorder the collection by swapping its final item into the
	 * removed slot. Successful removal invokes removed() before returning.
	 *
	 * @param {*} item Item to remove; defaults to this Entity.
	 * @returns {Boolean} True when an item was removed, otherwise false.
	 */
	remove = ( item = this ) => {
		const index = this.group.indexOf( item );

		if ( index < 0 ) {
			return false;
		}

		const last = this.group.length - 1;

		if ( index !== last ) {
			this.group[ index ] = this.group[ last ];
		}

		this.group.pop();
		this.removed( item );

		return true;
	}

	/**
	 * Respond after an item leaves the owning collection.
	 *
	 * Runs for removal, reconfiguration, and destruction while group still
	 * references the previous collection. Missing items do not notify.
	 *
	 * @protected
	 * @param {*} item Removed item; defaults to this Entity.
	 * @returns {void}
	 */
	removed = ( item = this ) => {}

	/**
	 * Release subclass-owned resources immediately before destruction.
	 *
	 * Subclasses override this inert lifecycle callback for hooks, listeners,
	 * or references that must be released while collection membership remains.
	 *
	 * @protected
	 * @returns {void}
	 */
	destroying = () => {}

	/**
	 * Respond after the Entity leaves its owning collection permanently.
	 *
	 * Subclasses override this inert lifecycle callback to publish their own
	 * observable destruction events without replacing destroy().
	 *
	 * @protected
	 * @returns {void}
	 */
	destroyed = () => {}

	/**
	 * Destroy the Entity by removing it from its owning collection.
	 *
	 * The collection remains associated with the Entity so callers can inspect
	 * or reuse it. Subclasses release their own hooks, listeners, and resources
	 * through the destroying() and destroyed() lifecycle callbacks.
	 *
	 * @returns {Boolean} True when the Entity was removed, otherwise false.
	 */
	destroy = () => {
		const index = this.group.indexOf( this );

		if ( index < 0 ) {
			return false;
		}

		this.destroying();

		const last = this.group.length - 1;

		if ( index !== last ) {
			this.group[ index ] = this.group[ last ];
		}

		this.group.pop();
		this.removed( this );
		this.destroyed();

		return true;
	}
}
