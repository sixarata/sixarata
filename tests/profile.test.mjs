import assert from 'node:assert/strict';
import test from 'node:test';

import { spawnSync } from 'node:child_process';

/** Contract: The repeatable profiler reports Room layout and rendering measurements without enforcing machine speed. */
test( 'Profiler reports deterministic workload dimensions and operation counts', () => {
	const result = spawnSync(
		process.execPath,
		[ 'tools/profile.mjs' ],
		{
			cwd: process.cwd(),
			encoding: 'utf8',
		}
	);

	assert.equal( result.status, 0, result.stderr );

	const report = JSON.parse( result.stdout );

	assert.equal( report.layouts.rooms, 12 );
	assert.ok( report.layouts.cells > 0 );
	assert.ok( report.layouts.tiles > 0 );
	assert.equal( report.layouts.parsed.count, 50 );
	assert.equal( report.layouts.cached.count, 50 );
	assert.equal( report.rendering.redraw.count, 1000 );
	assert.equal( report.rendering.cached.count, 1000 );
	assert.equal( report.rendering.moving.count, 1000 );
	assert.equal( report.rendering.redraw.rectanglesPerFrame, 60 );
	assert.equal( report.rendering.redraw.compositesPerFrame, 4 );
	assert.equal( report.rendering.cached.rectanglesPerFrame, 1 );
	assert.equal( report.rendering.cached.compositesPerFrame, 4 );
	assert.ok(
		report.rendering.moving.rectanglesPerFrame
		>= report.rendering.redraw.rectanglesPerFrame
	);
	assert.equal( report.rendering.moving.compositesPerFrame, 4 );
	assert.ok( report.layouts.parsed.min >= 0 );
	assert.ok( report.rendering.redraw.p95 >= report.rendering.redraw.median );
} );
