import assert from 'node:assert/strict';
import test from 'node:test';

import { installBrowserEnvironment } from './helpers/browser.mjs';

installBrowserEnvironment();

await import( '../scripts/core/game.js' );
const { default: Buffer } = await import( '../scripts/core/components/buffer.js' );
const { default: Layer } = await import( '../scripts/core/components/layer.js' );

/** Contract: Nested Layers draw into their immediate destinations for every direct and buffered combination. */
test( 'Layers nest through direct and buffered parents', () => {
	for ( const outerBuffered of [ true, false ] ) {
		for ( const innerBuffered of [ true, false ] ) {
			const host = { buffer: new Buffer( { w: 320, h: 240, d: 1 } ) };
			const output = host.buffer;
			const children = [];
			const outer = new Layer( host, 'outer', [ children ], true, outerBuffered );
			const destinations = [];
			const inner = new Layer( outer, 'inner', [ [ {
				render: () => destinations.push( outer.buffer ),
			} ] ], true, innerBuffered );
			children.push( inner );
			outer.render();
			assert.equal( destinations.length, 1 );
			assert.equal( destinations[ 0 ], innerBuffered ? inner.buffer : outerBuffered ? outer.buffer : output );
			assert.equal( host.buffer, output );
			if ( innerBuffered ) {
				const destination = outerBuffered ? outer.buffer : output;
				assert.equal( destination.canvas.drawImageArgs[ 0 ], inner.buffer.canvas );
			}
			if ( outerBuffered ) {
				assert.equal( output.canvas.drawImageArgs[ 0 ], outer.buffer.canvas );
			}
			assert.equal( outer.buffer === null, ! outerBuffered );
			assert.equal( inner.buffer === null, ! innerBuffered );
			inner.destroy();
			outer.destroy();
			assert.notEqual( output.canvas.removed, true );
			output.screen.ignore();
			output.destroy();
		}
	}
} );

/** Contract: Descendant changes propagate to cached ancestors and shared viewpoint movement refreshes every level. */
test( 'Nested cached Layers propagate invalidation and viewpoint changes', () => {
	const host = { buffer: new Buffer(), viewpoint: { x: 0, y: 0, z: 0 } };
	const children = [];
	const grandchildren = [];
	const outer = new Layer( host, 'outer', [ children ] );
	const middle = new Layer( outer, 'middle', [ grandchildren ] );
	let draws = 0;
	const inner = new Layer( middle, 'inner', [ [ { render: () => draws++ } ] ] );
	children.push( middle );
	grandchildren.push( inner );
	outer.render();
	outer.render();
	assert.equal( outer.stale(), false );
	assert.equal( draws, 1 );
	assert.equal( inner.invalidate( 'changed pixels' ), inner );
	assert.ok( [ outer, middle, inner ].every( layer => layer.cache.stale() ) );
	outer.render();
	assert.equal( draws, 2 );
	host.viewpoint.x = 32;
	outer.render();
	outer.render();
	assert.equal( draws, 3 );
	assert.ok( [ outer, middle, inner ].every( layer => layer.viewpoint.x === 32 ) );
	inner.destroy();
	middle.destroy();
	outer.destroy();
	host.buffer.screen.ignore();
	host.buffer.destroy();
} );

/** Contract: Live descendants refresh cached ancestors, while hidden descendants allow stable cached output. */
test( 'Nested Layers track live and hidden descendants', () => {
	const host = { buffer: new Buffer() };
	const children = [];
	const outer = new Layer( host, 'outer', [ children ] );
	let draws = 0;
	const inner = new Layer( outer, 'inner', [ [ { render: () => draws++ } ] ], false );
	children.push( inner );
	outer.render();
	outer.render();
	assert.equal( draws, 2 );
	inner.visible = false;
	assert.equal( outer.cache.stale(), true );
	outer.render();
	assert.equal( outer.stale(), false );
	outer.render();
	assert.equal( draws, 2 );
	const revision = outer.cache.revision;
	inner.visible = false;
	assert.equal( outer.cache.revision, revision );
	inner.visible = true;
	outer.render();
	assert.equal( draws, 3 );
	inner.destroy();
	outer.render();
	assert.equal( outer.stale(), false );
	assert.equal( draws, 3 );
	outer.destroy();
	host.buffer.screen.ignore();
	host.buffer.destroy();
} );

/** Contract: Nested rendering failures restore every borrowed destination and leave ancestor output stale. */
test( 'Nested Layers restore destinations after failure', () => {
	for ( const buffered of [ true, false ] ) {
		const host = { buffer: new Buffer() };
		const output = host.buffer;
		const children = [];
		const outer = new Layer( host, 'outer', [ children ], true, buffered );
		const inner = new Layer( outer, 'inner', [ [ { render: () => { throw new Error( 'failed' ); } } ] ] );
		children.push( inner );
		assert.throws( () => outer.render(), /failed/ );
		assert.equal( host.buffer, output );
		assert.equal( outer.buffer === null, ! buffered );
		assert.notEqual( outer.buffer, inner.buffer );
		assert.equal( outer.cache.stale(), true );
		assert.equal( inner.cache.stale(), true );
		inner.destroy();
		outer.destroy();
		output.screen.ignore();
		output.destroy();
	}
} );

/** Contract: Reconfiguration rejects cyclic ancestry atomically and notifies both old and new parents. */
test( 'Nested Layers preserve ownership across reconfiguration and cleanup', () => {
	const first = new Layer();
	const second = new Layer();
	const child = new Layer( first );
	first.cache.validate();
	second.cache.validate();
	assert.throws( () => first.set( child ), /acyclic/ );
	assert.throws( () => child.set( child ), /acyclic/ );
	assert.equal( child.parent, first );
	assert.equal( first.parent, null );
	child.set( second );
	assert.equal( first.cache.stale(), true );
	assert.equal( second.cache.stale(), true );
	second.cache.validate();
	child.reset();
	assert.equal( second.cache.stale(), true );
	assert.equal( child.parent, null );
	child.set( second );
	child.resize( { w: 32, h: 32, d: 1 } );
	const canvas = child.buffer.canvas;
	second.destroy();
	assert.notEqual( canvas.removed, true );
	assert.equal( child.parent, second );
	assert.equal( child.render(), child );
	child.destroy();
	child.destroy();
	first.destroy();
} );

/** Contract: A direct middle Layer forwards drawing and freshness between a cached ancestor and live descendants. */
test( 'Direct Layers bridge nested drawing and invalidation', () => {
	const host = { buffer: new Buffer( { w: 320, h: 240, d: 1 } ) };
	const children = [];
	const grandchildren = [];
	const outer = new Layer( host, 'outer', [ children ] );
	const middle = new Layer( outer, 'middle', [ grandchildren ], true, false );
	const calls = [];
	const inner = new Layer( middle, 'inner', [ [ {
		render: () => {
			assert.equal( middle.buffer, inner.buffer );
			calls.push( 'inner' );
		},
	} ] ], false );
	children.push( middle );
	grandchildren.push( inner );
	outer.render();
	outer.render();
	assert.deepEqual( calls, [ 'inner', 'inner' ] );
	assert.equal( middle.buffer, null );
	inner.invalidate();
	assert.equal( outer.cache.stale(), true );
	assert.equal( middle.cache.stale(), true );
	inner.destroy();
	middle.destroy();
	outer.destroy();
	host.buffer.screen.ignore();
	host.buffer.destroy();
} );

/** Contract: Invalidations raised during nested drawing prevent ancestors from validating partial compositions. */
test( 'Nested invalidation during drawing keeps every ancestor stale', () => {
	const host = { buffer: new Buffer() };
	const children = [];
	const outer = new Layer( host, 'outer', [ children ] );
	let invalidate = true;
	const inner = new Layer( outer, 'inner', [ [ {
		render: () => {
			if ( invalidate ) {
				inner.invalidate( 'during render' );
			}
		},
	} ] ] );
	children.push( inner );
	outer.render();
	assert.equal( inner.cache.stale(), true );
	assert.equal( outer.cache.stale(), true );
	invalidate = false;
	outer.render();
	assert.equal( inner.cache.valid(), true );
	assert.equal( outer.cache.valid(), true );
	inner.destroy();
	outer.destroy();
	host.buffer.screen.ignore();
	host.buffer.destroy();
} );
