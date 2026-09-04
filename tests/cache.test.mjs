import assert from 'node:assert/strict';
import test from 'node:test';

import { installBrowserEnvironment } from './helpers/browser.mjs';

installBrowserEnvironment();

const { default: Cache } = await import( '../scripts/core/utilities/cache.js' );
const { default: Time } = await import( '../scripts/core/utilities/time.js' );

/** Contract: Cache resets dirty and validates derived state against its current revision. */
test( 'Cache owns freshness lifecycle and diagnostic metadata', t => {
	const originalNow = Time.now;

	t.after( () => {
		Time.now = originalNow;
	} );

	Time.now = 100;
	const cache = new Cache();

	assert.equal( cache.dirty, true );
	assert.equal( cache.revision, 0 );
	assert.equal( cache.built, -1 );
	assert.equal( cache.changedAt, 100 );
	assert.equal( cache.builtAt, null );
	assert.equal( cache.reason, 'reset' );
	assert.equal( cache.valid(), false );
	assert.equal( cache.stale(), true );

	Time.now = 110;
	assert.equal( cache.validate(), true );
	assert.equal( cache.valid(), true );
	assert.equal( cache.stale(), false );
	assert.equal( cache.built, 0 );
	assert.equal( cache.builtAt, 110 );

	Time.now = 120;
	assert.equal( cache.invalidate( 'sprite frame' ), cache );
	assert.equal( cache.dirty, true );
	assert.equal( cache.revision, 1 );
	assert.equal( cache.changedAt, 120 );
	assert.equal( cache.reason, 'sprite frame' );
	assert.equal( cache.valid(), false );
	assert.equal( cache.set(), cache );
	assert.equal( cache.reason, 'reset' );
} );

/** Contract: Cache rejects late validation after a newer source revision invalidates the result. */
test( 'Cache protects asynchronous work from stale validation', t => {
	const originalNow = Time.now;

	t.after( () => {
		Time.now = originalNow;
	} );

	Time.now = 200;
	const cache = new Cache();

	cache.invalidate( 'started' );
	const captured = cache.revision;
	cache.invalidate( 'superseded' );

	Time.now = 210;
	assert.equal( cache.validate( captured ), false );
	assert.equal( cache.stale(), true );
	assert.equal( cache.builtAt, null );
	assert.equal( cache.validate(), true );
	assert.equal( cache.built, cache.revision );
	assert.equal( cache.builtAt, 210 );
} );

/** Contract: Cache rolls revisions safely without allowing an old validated generation to match. */
test( 'Cache keeps safe revision identity at numeric rollover', t => {
	const originalNow = Time.now;

	t.after( () => {
		Time.now = originalNow;
	} );

	Time.now = 300;
	const cache = new Cache();

	cache.revision = Number.MAX_SAFE_INTEGER;
	assert.equal( cache.validate(), true );
	cache.invalidate();

	assert.equal( cache.revision, 1 );
	assert.equal( cache.built, Number.MAX_SAFE_INTEGER );
	assert.equal( cache.reason, 'changed' );
	assert.equal( cache.stale(), true );
} );
