export const installBrowserEnvironment = () => {
	const listeners = new Map();
	let animationId = 0;

	globalThis.innerWidth = 1280;
	globalThis.innerHeight = 720;
	globalThis.devicePixelRatio = 2;
	globalThis.addEventListener = ( name, callback ) => {
		if ( ! listeners.has( name ) ) {
			listeners.set( name, [] );
		}

		listeners.get( name ).push( callback );
	};
	globalThis.removeEventListener = () => {};
	globalThis.requestAnimationFrame = () => ++animationId;
	globalThis.cancelAnimationFrame = () => {};

	const createContext = canvas => ( {
		canvas,
		imageSmoothingEnabled: true,
		globalAlpha: 1,
		fillStyle: '',
		font: '',
		setTransform: ( ...transform ) => {
			canvas.transform = transform;
		},
		scale: () => {},
		clearRect: () => {},
		fillRect: () => {},
		fillText: () => {},
		drawImage: ( ...args ) => {
			canvas.drawImageArgs = args;
		},
		getImageData: () => ( { data: new Uint8ClampedArray() } ),
		save: () => {},
		restore: () => {},
	} );

	const createElement = tag => {
		const element = {
			tagName: tag.toUpperCase(),
			children: [],
			style: {},
			width: 0,
			height: 0,
			appendChild( child ) {
				this.children.push( child );
			},
			remove() {},
		};

		if ( tag === 'canvas' ) {
			element.getContext = () => {
				element.context ??= createContext( element );

				return element.context;
			};
		}

		return element;
	};

	globalThis.document = {
		hidden: false,
		body: createElement( 'body' ),
		createElement,
	};
	globalThis.window = globalThis;
	globalThis.window.matchMedia = () => ( {
		addEventListener: () => {},
		removeEventListener: () => {},
	} );

	Object.defineProperty( globalThis, 'navigator', {
		configurable: true,
		value: {
			getGamepads: () => [],
		},
	} );

	class AudioContext {
		state = 'running';
		destination = {};
		resume = async () => {
			this.state = 'running';
		};
		createOscillator = () => ( {
			frequency: {},
			connect: () => {},
			start: () => {},
			stop: () => {},
		} );
		createGain = () => ( {
			gain: {},
			connect: () => {},
		} );
	}

	globalThis.AudioContext = AudioContext;

	return { listeners };
};
