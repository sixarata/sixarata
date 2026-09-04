import { performance } from 'node:perf_hooks';

import { installBrowserEnvironment } from '../tests/helpers/browser.mjs';

installBrowserEnvironment();

const { default: Game } = await import( '../scripts/core/game.js' );
const { default: Room } = await import( '../scripts/core/components/room.js' );
const { default: Size } = await import( '../scripts/core/physics/size.js' );
const Rooms = await import( '../scripts/content/rooms/exports.js' );

/**
 * Return a percentile from an ascending numeric sample.
 *
 * @param {Array<Number>} values Ascending duration values in milliseconds.
 * @param {Number} ratio Percentile ratio from zero through one.
 * @returns {Number} Selected duration, or zero for an empty sample.
 */
const percentile = (
	values = [],
	ratio  = 0.5
) => {
	if ( ! values.length ) {
		return 0;
	}

	const index = Math.min(
		values.length - 1,
		Math.max( 0, Math.ceil( values.length * ratio ) - 1 )
	);

	return values[ index ];
};

/**
 * Summarize duration samples without imposing machine-dependent thresholds.
 *
 * @param {Array<Number>} samples Unordered duration values in milliseconds.
 * @returns {Object} Count and millisecond distribution statistics.
 */
const summarize = (
	samples = []
) => {
	const values = [ ...samples ].sort( ( a, b ) => a - b );
	const total = values.reduce( ( sum, value ) => sum + value, 0 );

	return {
		count:  values.length,
		mean:   values.length ? total / values.length : 0,
		median: percentile( values, 0.5 ),
		p95:    percentile( values, 0.95 ),
		min:    values[ 0 ] ?? 0,
		max:    values.at( -1 ) ?? 0,
	};
};

/**
 * Measure repeated synchronous work after an unrecorded warmup pass.
 *
 * @param {Function} callback Work performed once per sample.
 * @param {Number} iterations Positive number of recorded samples.
 * @returns {Object} Millisecond distribution statistics.
 */
const measure = (
	callback   = () => {},
	iterations = 100
) => {
	callback();

	const samples = [];
	const count = Math.max( 1, Math.floor( Number( iterations ) || 0 ) );

	for ( let i = 0; i < count; i++ ) {
		const starts = performance.now();

		callback();
		samples.push( performance.now() - starts );
	}

	return summarize( samples );
};

/**
 * Compile character grids into immutable dimensions and spawn descriptors.
 *
 * @param {Array<Array<String>>} sources Raw Room row arrays.
 * @returns {Array<Object>} Compiled Room layouts without live Tile instances.
 */
const compile = (
	sources = []
) => sources.map( rows => {
	const tiles = [];
	let width = 0;

	for ( let y = 0; y < rows.length; y++ ) {
		const row = rows[ y ];

		width = Math.max( width, row.length );

		for ( let x = 0; x < row.length; x++ ) {
			if ( row[ x ] !== ' ' ) {
				tiles.push( {
					token: row[ x ],
					x,
					y,
				} );
			}
		}
	}

	return {
		size: {
			w: width,
			h: rows.length,
			d: 1,
		},
		tiles,
	};
} );

/**
 * Reconstruct fresh live Tiles from an immutable compiled Room layout.
 *
 * @param {Room} room Room receiving the reconstructed objects.
 * @param {Object} layout Compiled dimensions and spawn descriptors.
 * @param {Number} id Room identifier used by directional doors.
 * @returns {void}
 */
const reconstruct = (
	room   = {},
	layout = {},
	id     = 0
) => {
	room.id = id;
	room.size = new Size(
		layout.size.w,
		layout.size.h,
		layout.size.d
	);
	room.clear();

	for ( const tile of layout.tiles ) {
		room.parseTile(
			tile.token,
			{
				x: tile.x,
				y: tile.y,
				z: 0,
			}
		);
	}

	room.player();
};

/**
 * Measure repeated parsing and live-object reconstruction across every Room.
 *
 * @param {Number} iterations Number of complete Room-set reload samples.
 * @returns {Object} Load distribution and source-layout dimensions.
 */
const layouts = (
	iterations = 50
) => {
	Game.Hooks.reset();

	const room = new Room();
	const sources = Object.values( Rooms );

	room.rooms = sources;
	room.hooks();
	const compiled = compile( sources );

	const parsed = measure( () => {
		for ( let id = 0; id < sources.length; id++ ) {
			room.load( id );
		}
	}, iterations );
	const cached = measure( () => {
		for ( let id = 0; id < compiled.length; id++ ) {
			reconstruct( room, compiled[ id ], id );
		}
	}, iterations );

	room.clear();

	return {
		rooms: sources.length,
		cells: sources.reduce(
			( count, rows ) => count + rows.reduce( ( width, row ) => width + row.length, 0 ),
			0
		),
		tiles: compiled.reduce( ( count, layout ) => count + layout.tiles.length, 0 ),
		parsed,
		cached,
	};
};

/**
 * Prepare the initial Room at its bottom Camera boundary for render profiling.
 *
 * @returns {void}
 */
const prepare = () => {
	Game.Hooks.reset();
	Game.Room.reset();
	Game.Room.rooms = Object.values( Rooms );
	Game.Room.hooks();
	Game.View.resize();
	Game.Room.resize();
	Game.Room.load( 0 );
	Game.Camera.position = {
		x: 0,
		y: Math.max( 0, Game.Room.size.h - Game.View.buffer.size.h ),
		z: 0,
	};
};

/**
 * Measure Room rendering and count its Canvas-like drawing operations.
 *
 * The Node browser spy measures JavaScript submission overhead rather than GPU
 * rasterization. Browser profiling remains necessary for final render choices.
 *
 * @param {Boolean} cached Whether static Layer pixels persist between frames.
 * @param {Number} iterations Number of Room render samples.
 * @param {Boolean} moving Whether to alternate the Camera position each frame.
 * @returns {Object} Render distribution and operations per frame.
 */
const renderStrategy = (
	cached     = false,
	iterations = 1000,
	moving     = false
) => {
	prepare();

	const room = Game.Room;
	const policies = room.layers.map( layer => layer.cached );
	const position = {
		x: Game.Camera.position.x,
		y: Game.Camera.position.y,
		z: Game.Camera.position.z,
	};
	let frame = 0;

	for ( const layer of room.layers ) {
		layer.cached = cached
			? layer.name !== 'actors'
			: false;
		layer.invalidate( 'profile' );
	}

	// Build retained pixels before instrumenting the steady-state cached path.
	if ( cached ) {
		room.buffer.update();
		room.render();
	}

	const originals = room.layers.map( layer => ( {
		rect: layer.buffer.rect,
		put:  layer.buffer.put,
	} ) );
	const originalOutputPut = room.buffer.put;
	let rectangles = 0;
	let composites = 0;

	for ( const layer of room.layers ) {
		const rect = layer.buffer.rect;
		const put = layer.buffer.put;

		layer.buffer.rect = ( ...args ) => {
			rectangles++;

			return rect( ...args );
		};
		layer.buffer.put = ( ...args ) => {
			composites++;

			return put( ...args );
		};
	}
	room.buffer.put = ( ...args ) => {
		composites++;

		return originalOutputPut( ...args );
	};

	const result = measure( () => {
		room.buffer.update();
		if ( moving ) {
			Game.Camera.position.x = position.x + ( ++frame % 2 );
		}
		room.render();
	}, iterations );
	const measured = result.count + 1;

	for ( let i = 0; i < room.layers.length; i++ ) {
		room.layers[ i ].buffer.rect = originals[ i ].rect;
		room.layers[ i ].buffer.put  = originals[ i ].put;
		room.layers[ i ].cached      = policies[ i ];
	}
	room.buffer.put = originalOutputPut;
	Game.Camera.position.x = position.x;
	Game.Camera.position.y = position.y;
	Game.Camera.position.z = position.z;
	room.clear();

	return {
		...result,
		rectanglesPerFrame: rectangles / measured,
		compositesPerFrame: composites / measured,
	};
};

/**
 * Measure complete Layer redraws with caching disabled.
 *
 * @param {Number} iterations Number of Room render samples.
 * @returns {Object} Redraw distribution and operations per frame.
 */
const redraw = (
	iterations = 1000
) => renderStrategy( false, iterations );

/**
 * Measure production Layer caching with a fixed Camera.
 *
 * @param {Number} iterations Number of Room render samples.
 * @returns {Object} Cached distribution and operations per frame.
 */
const cached = (
	iterations = 1000
) => renderStrategy( true, iterations );

/**
 * Measure production Layer caching while Camera movement invalidates pixels.
 *
 * @param {Number} iterations Number of Room render samples.
 * @returns {Object} Moving-Camera distribution and operations per frame.
 */
const moving = (
	iterations = 1000
) => renderStrategy( true, iterations, true );

/**
 * Compare complete Layer redraw with production fixed-Camera caching.
 *
 * @returns {Object} Redraw, fixed-Camera, and moving-Camera measurements.
 */
const rendering = () => ( {
	redraw: redraw(),
	cached: cached(),
	moving: moving(),
} );

const report = {
	node: process.version,
	layouts: layouts(),
	rendering: rendering(),
};

console.log( JSON.stringify( report, null, '\t' ) );
