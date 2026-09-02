import assert                           from 'node:assert/strict';
import { spawnSync }                    from 'node:child_process';
import { mkdtempSync, mkdirSync,
	rmSync, writeFileSync }               from 'node:fs';
import { tmpdir }                       from 'node:os';
import { dirname, join }                from 'node:path';
import { fileURLToPath }                from 'node:url';
import test                             from 'node:test';

const root = dirname( dirname( fileURLToPath( import.meta.url ) ) );

/**
 * Run a command without involving a shell.
 *
 * @param {string} command Executable path or command name.
 * @param {string[]} args Command arguments.
 * @param {string} cwd Working directory for the child process.
 * @returns {import( 'node:child_process' ).SpawnSyncReturns<string>} Completed process result.
 */
const run = ( command, args, cwd = root ) => spawnSync( command, args, {
	cwd,
	encoding: 'utf8',
} );

/**
 * Create an isolated Git repository for staged lint checks.
 *
 * @returns {string} Temporary repository path.
 */
const repository = () => {
	const directory = mkdtempSync( join( tmpdir(), 'sixarata-lint-' ) );
	const scripts   = join( directory, 'scripts' );

	mkdirSync( scripts );

	assert.equal( run( 'git', [ 'init', '--quiet' ], directory ).status, 0 );

	return directory;
};

/** Contract: The lint wrapper forwards explicit file arguments to the native checker. */
test( 'lint wrapper forwards file arguments', ( t ) => {
	const directory = mkdtempSync( join( tmpdir(), 'sixarata-wrapper-' ) );
	const invalid   = join( directory, 'invalid.js' );

	t.after( () => rmSync( directory, { recursive: true } ) );
	writeFileSync( invalid, 'const missing = true\n' );

	const result = run( 'sh', [ 'tools/lint.sh', 'check', invalid ] );

	assert.equal( result.status, 1 );
	assert.equal( result.stderr.includes( `${ invalid }:1` ), true );
} );

/** Contract: Staged lint succeeds without scanning untracked JavaScript when no JavaScript is staged. */
test( 'staged lint does not fall back to the complete source tree', ( t ) => {
	const directory = repository();

	t.after( () => rmSync( directory, { recursive: true } ) );
	writeFileSync( join( directory, 'README.md' ), '# Fixture\n' );
	writeFileSync( join( directory, 'scripts/invalid.js' ), 'const missing = true\n' );
	assert.equal( run( 'git', [ 'add', 'README.md' ], directory ).status, 0 );

	const result = run( join( root, 'tools/lint.sh' ), [ '--staged' ], directory );

	assert.equal( result.status, 0 );
	assert.match( result.stderr, /No JavaScript files to lint\./ );
} );

/** Contract: Staged lint rejects staged JS and MJS files that violate the semicolon policy. */
test( 'staged lint checks staged JavaScript paths', ( t ) => {
	const directory = repository();

	t.after( () => rmSync( directory, { recursive: true } ) );
	writeFileSync( join( directory, 'scripts/invalid.js' ), 'const missing = true\n' );
	writeFileSync( join( directory, 'scripts/invalid.mjs' ), 'const missing = true\n' );
	assert.equal( run( 'git', [ 'add', 'scripts/invalid.js', 'scripts/invalid.mjs' ], directory ).status, 0 );

	const result = run( join( root, 'tools/lint.sh' ), [ '--staged' ], directory );

	assert.equal( result.status, 1 );
	assert.match( result.stderr, /scripts\/invalid\.js:1/ );
	assert.match( result.stderr, /scripts\/invalid\.mjs:1/ );
} );
