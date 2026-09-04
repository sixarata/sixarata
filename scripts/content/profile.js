import Buffer from '../core/components/buffer.js';

/**
 * Summarize unordered duration samples.
 *
 * @param {Array<Number>} samples Duration values in milliseconds.
 * @returns {Object} Count and millisecond distribution statistics.
 */
const summarize = (
	samples = []
) => {
	const values = [ ...samples ].sort( ( a, b ) => a - b );
	const total = values.reduce( ( sum, value ) => sum + value, 0 );
	const pick = ratio => values[ Math.min(
		values.length - 1,
		Math.max( 0, Math.ceil( values.length * ratio ) - 1 )
	) ] ?? 0;

	return {
		count:  values.length,
		mean:   values.length ? total / values.length : 0,
		median: pick( 0.5 ),
		p95:    pick( 0.95 ),
		min:    values[ 0 ] ?? 0,
		max:    values.at( -1 ) ?? 0,
	};
};

/**
 * Measure synchronous rendering on successive browser animation frames.
 *
 * Twenty warmup frames are excluded so module loading and initial Canvas state
 * do not dominate the recorded distribution.
 *
 * @param {Function} callback Rendering work performed during each frame.
 * @param {Number} frames Positive number of recorded frames.
 * @returns {Promise<Object>} Millisecond distribution statistics.
 */
const measure = async (
	callback = () => {},
	frames   = 300
) => {
	const samples = [];
	const count = Math.max( 1, Math.floor( Number( frames ) || 0 ) );
	const warmup = 20;

	for ( let frame = 0; frame < count + warmup; frame++ ) {
		await new Promise( resolve => requestAnimationFrame( resolve ) );

		const starts = performance.now();

		callback();

		if ( frame >= warmup ) {
			samples.push( performance.now() - starts );
		}
	}

	return summarize( samples );
};

/**
 * Compare complete Room redraws with an experimental fixed-camera static cache.
 *
 * The experiment pauses and restores the live Frame loop. Static groups are
 * drawn once into an isolated Buffer, while live groups continue drawing into
 * Room. The Camera remains fixed because Camera-aware invalidation and cropping
 * are deliberately not implemented by this measurement.
 *
 * @param {Object} game Running Sixarata game singleton.
 * @param {Number} frames Positive number of recorded frames per strategy.
 * @returns {Promise<Object>} Browser Canvas timing distributions.
 */
const profileRenderer = async (
	game   = {},
	frames = 300
) => {
	const room = game.Room;
	const output = room.buffer;
	const layer = new Buffer( output.size );
	const staticGroups = [ 'backgrounds', 'platforms', 'doors', 'walls' ];
	const liveGroups = [ 'enemies', 'particles', 'players', 'projectiles' ];
	let redraw;
	let cached;

	game.Frame.cancel();
	game.Frame.paused = true;

	try {
		redraw = await measure( () => {
			output.update();
			room.render();
		}, frames );

		room.buffer = layer;
		for ( const group of staticGroups ) {
			for ( const tile of room.tiles[ group ] ?? [] ) {
				tile.render();
			}
		}
		room.buffer = output;

		cached = await measure( () => {
			output.update();
			layer.put( output );

			for ( const group of liveGroups ) {
				for ( const tile of room.tiles[ group ] ?? [] ) {
					tile.render();
				}
			}

			output.put( game.View.buffer );
		}, frames );
	} finally {
		room.buffer = output;
		layer.screen.ignore();
		layer.destroy();
		game.Frame.paused = false;
		game.Frame.request();
	}

	return {
		redraw,
		cached,
	};
};

export default profileRenderer;
