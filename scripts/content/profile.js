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
 * Compare complete Room redraws with production Layer caching.
 *
 * The profiler pauses and restores the live Frame loop. The redraw strategy
 * temporarily makes every Layer live. The cached strategy restores each Layer's
 * production policy, where static layers persist and actors redraw every frame.
 * A final strategy alternates the Camera to measure cache invalidation overhead.
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
	const output = game.View.buffer;
	const policies = room.layers.map( layer => layer.cached );
	const position = {
		x: game.Camera.position.x,
		y: game.Camera.position.y,
		z: game.Camera.position.z,
	};
	let redraw;
	let cached;
	let moving;

	game.Frame.cancel();
	game.Frame.paused = true;

	try {
		for ( const layer of room.layers ) {
			layer.cached = false;
		}
		redraw = await measure( () => {
			output.update();
			room.render();
		}, frames );

		for ( let i = 0; i < room.layers.length; i++ ) {
			room.layers[ i ].cached = policies[ i ];
			room.layers[ i ].invalidate( 'profile' );
		}

		cached = await measure( () => {
			output.update();
			room.render();
		}, frames );

		let frame = 0;

		moving = await measure( () => {
			output.update();
			game.Camera.position.x = position.x + ( ++frame % 2 );
			room.render();
		}, frames );
	} finally {
		game.Camera.position.x = position.x;
		game.Camera.position.y = position.y;
		game.Camera.position.z = position.z;

		for ( let i = 0; i < room.layers.length; i++ ) {
			room.layers[ i ].cached = policies[ i ];
			room.layers[ i ].invalidate( 'profile restored' );
		}
		game.Frame.paused = false;
		game.Frame.request();
	}

	return {
		redraw,
		cached,
		moving,
	};
};

export default profileRenderer;
