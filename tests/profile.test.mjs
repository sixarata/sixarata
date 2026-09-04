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
	assert.equal( report.layouts.count, 50 );
	assert.equal( report.rendering.count, 1000 );
	assert.ok( report.rendering.rectanglesPerFrame > 0 );
	assert.equal( report.rendering.compositesPerFrame, 1 );
	assert.ok( report.layouts.min >= 0 );
	assert.ok( report.rendering.p95 >= report.rendering.median );
} );
