import Game from '../game.js';
import Settings from '../../content/settings.js';

import { Size } from '../physics/exports.js';
import Buffer from './buffer.js';
import Layer from './layer.js';
import { Tile, Door, Enemy, Player, Platform, Wall } from '../tiles/exports.js';

/**
 * The Room object.
 *
 * This object is responsible for parsing an array of characters
 * into Tile tiles.
 *
 * @todo Break this up...
 */
export default class Room {

	/**
	 * Per-frame compositing Buffer written into the visible View.
	 *
	 * @type {Buffer}
	 */
	buffer;

	/**
	 * Ordered presentation Layers composited from back to front.
	 *
	 * @type {Array<Layer>}
	 */
	layers;

	/**
	 * Logical Camera origin represented during the current render pass.
	 *
	 * @type {Object}
	 */
	viewpoint;

	/**
	 * Construct the Room.
	 *
	 * @returns {Room} this
	 */
	constructor() {
		return this.set();
	}

	/**
	 * Set the Room.
	 *
	 * @returns {Room} this
	 */
	set = () => {
		return this.reset();
	}

	/**
	 * Reset the Room.
	 *
	 * @returns {Room} this
	 */
	reset = () => {
		for ( const layer of this.layers ?? [] ) {
			layer.destroy();
		}

		// Buffer.
		this.buffer = new Buffer();
		this.layers = [
			new Layer( this, 'background', [ 'backgrounds', 'platforms', 'doors' ] ),
			new Layer( this, 'actors', [ 'enemies', 'particles', 'players', 'projectiles' ], false ),
			new Layer( this, 'foreground', [ 'walls' ] ),
		];

		// Size.
		this.size = new Size();

		// Rooms.
		this.id        = Settings.components.room.start;
		this.previous  = 0;
		this.grid      = [];
		this.viewpoint = { x: 0, y: 0, z: 0 };

		// Player.
		this.playerGrid = false;
		this.playerNext = false;
		this.playerPrev = false;
		this.playerDoor = false;

		// For now...
		this.rooms = [];

		// Return.
		return this;
	}

	/**
	 * Resize the Room output and every Layer to the logical viewport.
	 *
	 * Device pixel ratio backing dimensions remain owned by each Buffer.
	 *
	 * @returns {void}
	 */
	resize = () => {
		const size = {
			w: innerWidth,
			h: innerHeight,
			d: 1,
		};

		this.buffer.resize( size );

		for ( const layer of this.layers ) {
			layer.resize( size );
		}
	}

	/**
	 * Load the Room.
	 *
	 * @param {Number} id       The Room ID.
	 * @param {Number} previous The previous Room ID.
	 */
	load = (
		id,
		previous
	) => {

		// Fallback ID when called without explicit args.
		if ( id === undefined || id === null ) {
			id = this.id;
		}

		// Default previous to current ID unless explicitly provided.
		if ( previous === undefined ) {
			previous = this.id;
		}

		// Juggle previous, so retries are correctly located.
		if ( this.rooms[ id ] ) {
			this.previous = previous;
			this.id       = id;
			this.grid     = this.rooms[ id ];
		}

		// Skip if no Room.
		if ( ! this.grid.length ) {
			return;
		}

		// Size.
		this.size = new Size(
			Math.max( ...this.grid.map( row => row.length ) ),
			this.grid.length,
			1
		);

		// Tiles.
		this.clear();

		// Hook.
		Game.Hooks.do( 'Room.loaded' );
	}

	/**
	 * Destroy every existing Tile and restore empty Room tile collections.
	 *
	 * Clearing invalidates every presentation Layer because collection identity
	 * and derived pixels both change.
	 *
	 * @returns {void}
	 */
	clear = () => {

		// Let existing tiles release hooks and references before replacing groups.
		const existing = this.tiles
			? Object.values( this.tiles ).flat()
			: [];

		for ( const tile of existing ) {
			tile?.destroy?.();
		}

		// Player.
		this.playerGrid = false;
		this.playerNext = false;
		this.playerPrev = false;
		this.playerDoor = false;

		// Tiles.
		this.tiles = {
			backgrounds: [],
			platforms:   [],
			doors:       [],
			enemies:     [],
			particles:   [],
			players:     [],
			projectiles: [],
			walls:       [],
		};

		this.invalidate( null, 'room cleared' );
	}

	/**
	 * Player is retrying.
	 *
	 * @returns {Boolean}
	 */
	retry = () => {

		// Reload the Room.
		this.load( this.id, this.previous );

		// Return true so callers can bail easier.
		return true;
	}

	/**
	 * Register Room lifecycle and Layer invalidation hooks.
	 *
	 * @returns {void}
	 */
	hooks = () => {

		// Run.
		Game.Hooks.add( 'Run.start', this.load );

		// View.
		Game.Hooks.add( 'View.tick',   this.tick );
		Game.Hooks.add( 'View.update', this.update );
		Game.Hooks.add( 'View.render', this.render );

		// Buffer.
		Game.Hooks.add( 'Room.tick',   this.buffer.tick );
		Game.Hooks.add( 'Room.update', this.buffer.update );
		Game.Hooks.add( 'Room.render', this.buffer.render );

		// Self.
		Game.Hooks.add( 'Room.tick',   this.resize );
		Game.Hooks.add( 'Room.loaded', this.parse );
		Game.Hooks.add( 'Room.loaded', this.player );

		// Layers.
		Game.Hooks.add( 'Tile.added',   this.changed );
		Game.Hooks.add( 'Tile.destroy', this.changed );
	}

	/**
	 * Tick through time.
	 */
	tick = () => {
		Game.Hooks.do( 'Room.tick' );

		// Tick all tiles.
		this.loopTiles( 'tick' );
	}

	/**
	 * Update the Room.
	 */
	update = () => {
		Game.Hooks.do( 'Room.update' );

		// Update all tiles.
		this.loopTiles( 'update' );
	}

	/**
	 * Composite every ordered Layer and publish the Room Buffer to View.
	 *
	 * The current Camera position becomes the presentation viewpoint used by
	 * cached Layers to detect scrolling.
	 *
	 * @returns {void}
	 */
	render = () => {
		Game.Hooks.do( 'Room.render' );
		this.viewpoint = Game.Camera.position ?? { x: 0, y: 0, z: 0 };

		// Render and composite presentation layers in their declared order.
		for ( const layer of this.layers ) {
			layer.render();
		}

		// Output the Buffer.
		this.buffer.put( Game.View.buffer );
	}

	/**
	 * Invalidate the presentation layer containing a changed Tile.
	 *
	 * Tile collections remain authoritative for simulation and collision. This
	 * callback only marks their derived pixels stale.
	 *
	 * @param {Tile|null} tile Added or removed Tile, including its owning group.
	 * @returns {void}
	 */
	changed = ( tile = null ) => {
		this.invalidate( tile?.group, 'tile changed' );
	}

	/**
	 * Invalidate matching presentation layers after Room state changes.
	 *
	 * Omitting a group invalidates every layer. Supplying a group limits the
	 * change to the Layer that owns that exact Room tile collection.
	 *
	 * @param {Array|null} group Optional Room tile collection.
	 * @param {String} reason Concise diagnostic invalidation reason.
	 * @returns {void}
	 */
	invalidate = (
		group  = null,
		reason = 'changed'
	) => {
		for ( const layer of this.layers ) {
			if ( group === null || layer.has( group ) ) {
				layer.invalidate( reason );
			}
		}
	}

	/**
	 * Parse the Room.
	 *
	 * @returns {Void}
	 */
	parse = () => {

		// Get rows.
		let l = this.grid.length;

		// Skip room if empty.
		if ( ! l ) {
			return;
		}

		// Loop through rows.
		for ( let i = 0; i < l; i++ ) {
			this.parseRow( i );
		}
	}

	/**
	 * Parse a row in the Room.
	 *
	 * @param   {Number} row Default 0. The row to parse.
	 * @returns {Void}
	 */
	parseRow = (
		row = 0
	) => {

		// Split into chars.
		let split = this.grid[ row ].split( '' ),
			sl    = split.length;

		// Skip row if empty.
		if ( ! sl || ! split.join( '' ).trim() ) {
			return;
		}

		// Loop through chars.
		for ( let i = 0; i < sl; i++ ) {
			this.parseTile(
				split[ i ],
				{
					x: i,
					y: row,
				}
			);
		}
	}

	/**
	 * Parse a Tile in a Row.
	 *
	 * @param   {String}   token
	 * @param   {Position} position
	 * @returns {Void}
	 */
	parseTile = (
		token    = '',
		position = { x: 0, y: 0, z: 0 }
	) => {

		// Skip token if empty.
		if ( ! token || ( ' ' === token ) ) {
			return;
		}

		// Default size.
		const size = { w: 1, h: 1, d: 1 };

		// What kind of tile to draw.
		switch ( token ) {

			// Backgrounds.
			case Settings.tiles.ambient.cloud :
				new Tile( this.tiles.backgrounds, position, size, Game.Colors.cloud(), 'cloud', 0 );
				break;

			// Platforms.
			case Settings.tiles.platforms.grass :
				new Platform( this.tiles.platforms, position );
				break;

			// Players.
			case Settings.tiles.players.one :
				new Player( this.tiles.players, position );
				this.playerGrid = true;
				break;

			// Projectiles.
			case Settings.tiles.enemies.shooter :
				new Enemy( this.tiles.enemies, position );
				break;

			// Doors.
			case Settings.tiles.doors.forward :
				new Door( this.tiles.doors, position, size, this.id + 1 );

				// Reposition to the left of the door.
				position.x     -= 1.5;
				this.playerPrev = position;
				break;
			case Settings.tiles.doors.backward :
				new Door( this.tiles.doors, position, size, this.id - 1 );

				// Reposition to the right of the door.
				position.x     += 1.5;
				this.playerNext = position;
				break;

			// Walls.
			case Settings.tiles.walls.rock :
				new Wall( this.tiles.walls, position );
				break;
		}

		// Hook.
		Game.Hooks.do( 'Room.parseTile', token, position );
	}

	/**
	 * Loop through tile objects, and call one of their methods.
	 *
	 * @param {String} callback Tile lifecycle method name.
	 * @returns {void}
	 */
	loopTiles = (
		callback = ''
	) => {

		// Skip if no callback or tiles.
		if ( ! callback || ! this.tiles ) {
			return;
		}

		// Tiles.
		for ( const group in this.tiles ) {
			if ( ! Object.prototype.hasOwnProperty.call( this.tiles, group ) ) {
				continue;
			}

			const items = this.tiles[ group ];
			const l = items.length;

			// Skip if empty.
			if ( ! l ) {
				continue;
			}

			// Callback.
			for ( let i = 0; i < l; i++ ) {

				// Skip if missing.
				if ( ! items[ i ] ) {
					continue;
				}

				// Do the callback.
				items[ i ][ callback ]();
			}
		}
	}

	/**
	 * Set Player Position in Room if not in grid.
	 */
	player = () => {

		// Skip if Player in Grid.
		if ( true === this.playerGrid ) {
			return;
		}

		// Prevent recursion.
		this.playerGrid = true;

		// Guess the location.
		( this.previous > this.id )
			? new Player( this.tiles.players, this.playerPrev )
			: new Player( this.tiles.players, this.playerNext );
	}
}
