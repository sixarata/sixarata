import { performance } from 'node:perf_hooks';

import { installBrowserEnvironment } from '../tests/helpers/browser.mjs';

installBrowserEnvironment();

const { default: Game } = await import( '../scripts/core/game.js' );
const { default: Buffer } = await import( '../scripts/core/components/buffer.js' );
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
 * @param {Number} iterations Number of Room render samples.
 * @returns {Object} Render distribution and operations per frame.
 */
const redraw = (
	iterations = 1000
) => {
	prepare();

	const originalRect = Game.Room.buffer.rect;
	const originalPut = Game.Room.buffer.put;
	let rectangles = 0;
	let composites = 0;

	Game.Room.buffer.rect = ( ...args ) => {
		rectangles++;

		return originalRect( ...args );
	};
	Game.Room.buffer.put = ( ...args ) => {
		composites++;

		return originalPut( ...args );
	};

	const result = measure( () => {
		Game.Room.buffer.update();
		Game.Room.render();
	}, iterations );
	const measured = result.count + 1;

	Game.Room.buffer.rect = originalRect;
	Game.Room.buffer.put = originalPut;
	Game.Room.clear();

	return {
		...result,
		rectanglesPerFrame: rectangles / measured,
		compositesPerFrame: composites / measured,
	};
};

/**
 * Measure an experimental fixed-camera static cache without changing runtime.
 *
 * Static Room groups are rendered once into a retained Buffer. Each measured
 * frame composites that Buffer, renders live groups, and composites Room into
 * View. This measures the best case before Camera invalidation is considered.
 *
 * @param {Number} iterations Number of experimental render samples.
 * @returns {Object} Render distribution and operations per frame.
 */
const cached = (
	iterations = 1000
) => {
	prepare();

	const room = Game.Room;
	const output = room.buffer;
	const layer = new Buffer( output.size );
	const staticGroups = [ 'backgrounds', 'platforms', 'doors', 'walls' ];
	const liveGroups = [ 'enemies', 'particles', 'players', 'projectiles' ];

	room.buffer = layer;
	for ( const group of staticGroups ) {
		for ( const tile of room.tiles[ group ] ) {
			tile.render();
		}
	}
	room.buffer = output;

	const originalRect = output.rect;
	const originalLayerPut = layer.put;
	const originalOutputPut = output.put;
	let rectangles = 0;
	let composites = 0;

	output.rect = ( ...args ) => {
		rectangles++;

		return originalRect( ...args );
	};
	layer.put = ( ...args ) => {
		composites++;

		return originalLayerPut( ...args );
	};
	output.put = ( ...args ) => {
		composites++;

		return originalOutputPut( ...args );
	};

	const result = measure( () => {
		output.update();
		layer.put( output );

		for ( const group of liveGroups ) {
			for ( const tile of room.tiles[ group ] ) {
				tile.render();
			}
		}

		output.put( Game.View.buffer );
	}, iterations );
	const measured = result.count + 1;

	output.rect = originalRect;
	layer.put = originalLayerPut;
	output.put = originalOutputPut;
	room.clear();
	layer.destroy();

	return {
		...result,
		rectanglesPerFrame: rectangles / measured,
		compositesPerFrame: composites / measured,
	};
};

/**
 * Compare complete redraw with the fixed-camera static-cache experiment.
 *
 * @returns {Object} Redraw and cached render measurements.
 */
const rendering = () => ( {
	redraw: redraw(),
	cached: cached(),
} );

const report = {
	node: process.version,
	layouts: layouts(),
	rendering: rendering(),
};

console.log( JSON.stringify( report, null, '\t' ) );
