import Time from './time.js';

/**
 * Priority-ordered synchronous event hooks.
 */
export default class Hooks {

	#current = '';
	#queued = new Map();
	#done = [];
	#suspended = [];

	constructor() {
		return this.reset();
	}

	set = () => this.reset();

	reset = () => {
		this.#current = '';
		this.#queued.clear();
		this.#done = [];
		this.#suspended = [];

		return this;
	}

	add = (
		name     = '',
		callback = null,
		priority = 10
	) => {
		if ( ! name || typeof callback !== 'function' ) {
			return false;
		}

		if ( ! this.#queued.has( name ) ) {
			this.#queued.set( name, new Map() );
		}

		const priorities = this.#queued.get( name );

		if ( ! priorities.has( priority ) ) {
			priorities.set( priority, [] );
		}

		const callbacks = priorities.get( priority );
		const existing = callbacks.indexOf( callback );

		if ( existing >= 0 ) {
			return existing + 1;
		}

		return callbacks.push( callback );
	}

	remove = (
		name     = '',
		callback = null,
		priority = 10
	) => {
		const callbacks = this.#callbacks( name, priority );

		if ( ! callbacks || typeof callback !== 'function' ) {
			return false;
		}

		const index = callbacks.indexOf( callback );

		if ( index < 0 ) {
			return false;
		}

		callbacks.splice( index, 1 );
		this.#prune( name, priority );

		return true;
	}

	clear = ( name = '' ) => name
		? this.#queued.delete( name )
		: false;

	current = () => this.#current;

	done = () => [ ...this.#done ];

	suspended = () => [ ...this.#suspended ];

	queued = () => [ ...this.#queued.keys() ];

	do = (
		name = '',
		...args
	) => {
		let retval = args.length ? args[ 0 ] : false;
		const priorities = this.#queued.get( name );

		this.#current = name;

		try {
			if ( priorities ) {
				const ordered = [ ...priorities.keys() ].sort( ( a, b ) => a - b );

				for ( const priority of ordered ) {
					for ( const callback of [ ...priorities.get( priority ) ] ) {
						retval = callback( ...args );
						this.#done.push( {
							name,
							callback,
							priority,
						} );
					}
				}
			}
		} finally {
			this.#current = '';
		}

		if ( this.#done.length > 1000 ) {
			this.#done.splice( 0, this.#done.length - 1000 );
		}

		return retval;
	}

	suspend = (
		name     = '',
		callback = null,
		priority = 10,
		options  = {}
	) => {
		const milliseconds = Math.max( 0, Number( options.ms ) || 0 );
		const frames = Math.max( 0, Math.floor( Number( options.frames ) || 0 ) );

		if (
			! this.exists( name, callback, priority )
			||
			( milliseconds === 0 && frames === 0 )
		) {
			return false;
		}

		this.remove( name, callback, priority );
		this.#suspended.push( {
			name,
			callback,
			priority,
			expiresAt: milliseconds ? Time.now + milliseconds : 0,
			framesLeft: frames,
			usesFrames: frames > 0,
		} );

		return true;
	}

	resume = (
		name     = '',
		callback = null,
		priority = 10
	) => {
		const index = this.#suspended.findIndex( entry => (
			entry.name === name
			&&
			entry.callback === callback
			&&
			entry.priority === priority
		) );

		if ( index < 0 ) {
			return false;
		}

		const [ entry ] = this.#suspended.splice( index, 1 );
		this.add( entry.name, entry.callback, entry.priority );

		return true;
	}

	process = ( advanceFrames = false ) => {
		const remaining = [];

		for ( const entry of this.#suspended ) {
			if ( advanceFrames && entry.framesLeft > 0 ) {
				entry.framesLeft--;
			}

			const timeReady = entry.expiresAt > 0 && Time.now >= entry.expiresAt;
			const frameReady = entry.usesFrames && entry.framesLeft === 0;

			if ( timeReady || frameReady ) {
				this.add( entry.name, entry.callback, entry.priority );
			} else {
				remaining.push( entry );
			}
		}

		this.#suspended = remaining;
	}

	doing = ( name = '' ) => name === this.#current;

	did = (
		name     = '',
		callback = null,
		priority = 10
	) => this.#done.some( entry => (
		entry.name === name
		&&
		( typeof callback !== 'function' || entry.callback === callback )
		&&
		( typeof callback !== 'function' || entry.priority === priority )
	) );

	exists = (
		name     = '',
		callback = null,
		priority = 10
	) => {
		const callbacks = this.#callbacks( name, priority );

		if ( ! callbacks ) {
			return false;
		}

		return typeof callback === 'function'
			? callbacks.includes( callback )
			: callbacks.length > 0;
	}

	#callbacks = (
		name,
		priority
	) => this.#queued.get( name )?.get( priority );

	#prune = (
		name,
		priority
	) => {
		const priorities = this.#queued.get( name );

		if ( ! priorities ) {
			return;
		}

		if ( priorities.get( priority )?.length === 0 ) {
			priorities.delete( priority );
		}

		if ( priorities.size === 0 ) {
			this.#queued.delete( name );
		}
	}
}
