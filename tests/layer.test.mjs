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
			const outer = new Layer( host, 'outer', [], true, outerBuffered );
			const destinations = [];
			const inner = new Layer( null, 'inner', [ [ {
				render: () => destinations.push( outer.buffer ),
			} ] ], true, innerBuffered );
			outer.add( inner );
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
	const outer = new Layer( host, 'outer', [] );
	const middle = new Layer( null, 'middle', [] );
	let draws = 0;
	const inner = new Layer( null, 'inner', [ [ { render: () => draws++ } ] ] );
	outer.add( middle );
	middle.add( inner );
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
	const outer = new Layer( host, 'outer', [] );
	let draws = 0;
	const inner = new Layer( null, 'inner', [ [ { render: () => draws++ } ] ], false );
	outer.add( inner );
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
			const outer = new Layer( host, 'outer', [], true, buffered );
		const inner = new Layer( null, 'inner', [ [ { render: () => { throw new Error( 'failed' ); } } ] ] );
		outer.add( inner );
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

/** Contract: Managed membership rejects cycles atomically and reconfiguration detaches without destroying children. */
test( 'Nested Layers preserve ownership across reconfiguration and cleanup', () => {
	const first = new Layer();
	const second = new Layer();
	const child = new Layer();
	first.add( child );
	first.cache.validate();
	second.cache.validate();
	assert.throws( () => child.add( first ), /acyclic/ );
	assert.throws( () => child.add( child ), /acyclic/ );
	assert.throws( () => child.set( first ), /Layer.add/ );
	assert.equal( child.parent, first );
	assert.equal( first.parent, null );
	second.add( child );
	assert.equal( first.cache.stale(), true );
	assert.equal( second.cache.stale(), true );
	assert.deepEqual( first.children, [] );
	second.cache.validate();
	child.reset();
	assert.equal( second.cache.stale(), true );
	assert.equal( child.parent, null );
	assert.deepEqual( second.children, [] );
	second.add( child );
	child.resize( { w: 32, h: 32, d: 1 } );
	const canvas = child.buffer.canvas;
	second.destroy();
	assert.notEqual( canvas.removed, true );
	assert.equal( child.parent, null );
	assert.equal( child.render(), child );
	child.destroy();
	child.destroy();
	first.destroy();
} );

/** Contract: A direct middle Layer forwards drawing and freshness between a cached ancestor and live descendants. */
test( 'Direct Layers bridge nested drawing and invalidation', () => {
	const host = { buffer: new Buffer( { w: 320, h: 240, d: 1 } ) };
	const outer = new Layer( host, 'outer', [] );
	const middle = new Layer( null, 'middle', [], true, false );
	const calls = [];
	const inner = new Layer( null, 'inner', [ [ {
		render: () => {
			assert.equal( middle.buffer, inner.buffer );
			calls.push( 'inner' );
		},
	} ] ], false );
	outer.add( middle );
	middle.add( inner );
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
	const outer = new Layer( host, 'outer', [] );
	let invalidate = true;
	const inner = new Layer( null, 'inner', [ [ {
		render: () => {
			if ( invalidate ) {
				inner.invalidate( 'during render' );
			}
		},
	} ] ] );
	outer.add( inner );
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

/** Contract: Managed additions are unique, preserve order, reject invalid input, and expose read-only relationship snapshots. */
test( 'Layer membership has one authoritative mutation API', () => {
	const parent = new Layer();
	const first = new Layer();
	const second = new Layer();
	const third = new Layer();
	assert.equal( parent.add( first ).add( second ).add( third ), parent );
	assert.deepEqual( parent.children, [ first, second, third ] );
	parent.cache.validate();
	assert.equal( parent.add( second ), parent );
	assert.equal( parent.cache.valid(), true );
	assert.deepEqual( parent.children, [ first, second, third ] );
	parent.children.pop();
	assert.equal( parent.children.length, 3 );
	assert.throws( () => { first.parent = third; }, TypeError );
	assert.equal( first.parent, parent );
	for ( const invalid of [ undefined, null, {}, [] ] ) {
		assert.throws( () => parent.add( invalid ), TypeError );
		assert.equal( parent.remove( invalid ), false );
	}
	assert.equal( parent.cache.valid(), true );
	assert.equal( parent.remove( second ), true );
	assert.equal( second.parent, null );
	assert.deepEqual( parent.children, [ first, third ] );
	assert.equal( parent.cache.stale(), true );
	parent.cache.validate();
	assert.equal( parent.remove( second ), false );
	assert.equal( parent.cache.valid(), true );
	parent.reset();
	assert.equal( first.parent, null );
	assert.equal( third.parent, null );
	assert.deepEqual( parent.children, [] );
	first.destroy();
	second.destroy();
	third.destroy();
	parent.destroy();
} );

/** Contract: Child mutation during rendering skips detached children and defers newly attached children until the next pass. */
test( 'Layer visits managed children safely during membership changes', () => {
	const host = { buffer: new Buffer() };
	const parent = new Layer( host );
	const calls = [];
	const first = new Layer( null, 'first', [ [ { render: () => calls.push( 'first' ) } ] ], false, false );
	const removed = new Layer( null, 'removed', [ [ { render: () => calls.push( 'removed' ) } ] ], false, false );
	const last = new Layer( null, 'last', [ [ { render: () => calls.push( 'last' ) } ] ], false, false );
	const added = new Layer( null, 'added', [ [ { render: () => calls.push( 'added' ) } ] ], false, false );
	first.groups[ 0 ].push( { render: () => {
		parent.remove( first );
		parent.remove( removed );
		parent.add( added );
	} } );
	parent.add( first ).add( removed ).add( last );
	parent.render();
	assert.deepEqual( calls, [ 'first', 'last' ] );
	assert.equal( parent.cache.stale(), true );
	calls.length = 0;
	parent.render();
	assert.deepEqual( calls, [ 'last', 'added' ] );
	for ( const layer of [ first, removed, last, added, parent ] ) {
		layer.destroy();
	}
	host.buffer.screen.ignore();
	host.buffer.destroy();
} );

/** Contract: Reparenting retains child resources and content while refreshing both compositions and the inherited viewpoint. */
test( 'Layer reparenting preserves content and refreshes both hosts', () => {
	const firstHost = { buffer: new Buffer(), viewpoint: { x: 0, y: 0, z: 0 } };
	const secondHost = { buffer: new Buffer(), viewpoint: { x: 64, y: 0, z: 0 } };
	const first = new Layer( firstHost );
	const second = new Layer( secondHost );
	let draws = 0;
	const contents = [ { render: () => draws++ } ];
	const child = new Layer( null, 'child', [ contents ] );
	first.add( child );
	first.render();
	first.render();
	const buffer = child.buffer;
	second.cache.validate();
	second.add( child );
	assert.equal( child.buffer, buffer );
	assert.equal( child.groups[ 0 ], contents );
	assert.equal( contents.length, 1 );
	assert.equal( first.cache.stale(), true );
	assert.equal( second.cache.stale(), true );
	first.render();
	assert.equal( draws, 1 );
	second.render();
	assert.equal( draws, 2 );
	assert.equal( child.viewpoint.x, 64 );
	child.destroy();
	assert.deepEqual( second.children, [] );
	first.destroy();
	second.destroy();
	for ( const host of [ firstHost, secondHost ] ) {
		host.buffer.screen.ignore();
		host.buffer.destroy();
	}
} );

/** Contract: A buffered child detaching during drawing restores its old destination and does not composite detached pixels. */
test( 'Buffered child detachment restores the active destination', () => {
	const host = { buffer: new Buffer() };
	const parent = new Layer( host );
	const output = host.buffer;
	const child = new Layer( null, 'child', [ [ { render: () => parent.remove( child ) } ] ] );
	parent.add( child );
	parent.render();
	assert.equal( host.buffer, output );
	assert.notEqual( parent.buffer, child.buffer );
	assert.equal( parent.buffer.canvas.drawImageArgs, undefined );
	assert.equal( child.parent, null );
	assert.deepEqual( parent.children, [] );
	assert.equal( parent.cache.stale(), true );
	child.destroy();
	parent.destroy();
	output.screen.ignore();
	output.destroy();
} );
