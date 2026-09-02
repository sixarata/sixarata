/**
 * Install the minimal browser APIs required by engine tests.
 *
 * The mocks preserve logical canvas dimensions, rendering calls, animation
 * identifiers, input APIs, and a running audio pipeline without starting a
 * real browser.
 *
 * @returns {Object} Captured browser event listeners.
 */
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

	/**
	 * @param {Object} canvas Owning canvas mock.
	 * @returns {Object} A canvas context spy bound to the supplied canvas.
	 */
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

	/**
	 * @param {String} tag HTML tag name.
	 * @returns {Object} A minimal DOM element for the requested tag.
	 */
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

	/** Minimal running Web Audio pipeline used by Game.Audio. */
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
