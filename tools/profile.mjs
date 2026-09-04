import { performance } from 'node:perf_hooks';

import { installBrowserEnvironment } from '../tests/helpers/browser.mjs';

installBrowserEnvironment();

const { default: Game } = await import( '../scripts/core/game.js' );
const { default: Room } = await import( '../scripts/core/components/room.js' );
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

	const result = measure( () => {
		for ( let id = 0; id < sources.length; id++ ) {
			room.load( id );
		}
	}, iterations );

	room.clear();

	return {
		...result,
		rooms: sources.length,
		cells: sources.reduce(
			( count, rows ) => count + rows.reduce( ( width, row ) => width + row.length, 0 ),
			0
		),
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
const rendering = (
	iterations = 1000
) => {
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

const report = {
	node: process.version,
	layouts: layouts(),
	rendering: rendering(),
};

console.log( JSON.stringify( report, null, '\t' ) );
