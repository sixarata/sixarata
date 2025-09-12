import Game from '../game.js';
import Settings from '../../custom/settings.js';

import { Size } from '../physics/exports.js';
import { Buffer } from './exports.js';
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
	 * Construct the Room.
	 */
	constructor() {
		this.set();
	}

	/**
	 * Set the Room.
	 */
	set = () => {
		this.reset();
	}

	/**
	 * Reset the Room.
	 */
	reset = () => {

		// Buffer.
		this.buffer = new Buffer();

		// Size.
		this.size = new Size();

		// Rooms.
		this.id       = Settings.components.room.start;
		this.previous = 0;
		this.grid     = [];

		// Player.
		this.playerGrid = false;
		this.playerNext = false;
		this.playerPrev = false;
		this.playerDoor = false;

		// For now...
		this.rooms = [];
	}

	/**
	 * Resize the Map.
	 */
	resize = () => {
		this.buffer.resize( {
			w: innerWidth,
			h: innerHeight,
			d: 1,
		} );
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
			this.grid[ 0 ].split( '' ).length,
			this.grid.length,
			1
		);

		// Tiles.
		this.clear();

		// Hook.
		Game.Hooks.do( 'Room.loaded' );
	}

	/**
	 * Clear the Room.
	 */
	clear = () => {

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
	 * Early events.
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
	 * Render the Room.
	 */
	render = () => {
		Game.Hooks.do( 'Room.render' );

		// Render all tiles.
		this.loopTiles( 'render' );

		// Output the Buffer.
		this.buffer.put( Game.View.buffer );
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
	 * @param {Function} callback
	 */
	loopTiles = (
		callback = ''
	) => {

		// Skip if no callback or tiles.
		if ( ! callback || ! this.tiles ) {
			return;
		}

		// Tiles.
		Object.values( this.tiles ).forEach(
			items => {

				// Defaults.
				let l = items.length;

				// Skip if empty.
				if ( ! l ) {
					return;
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
		);
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
