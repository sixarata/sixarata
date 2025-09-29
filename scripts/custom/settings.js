// Default settings.
export default {

	// Interfaces
	interfaces: {

		// Inputs.
		inputs: {
			keyboard: {},
			gamepad:  {},
			mouse:    {},
		},

		// Screen.
		screen: {
			dpr:  2,
			size: 32,
		},
	},

	// Components.
	components: {

		// Frames.
		frames: {
			throttle: 0.5,
			second:   1000,
			goal:     60,
			clamp:    5,
		},

		// Room.
		room: {
			start: 0,
		},

		// View.
		view: {
			hud: true,
		},
	},

	// Player.
	player: {
		move: {
			base:    1,
			walk:    10,
			run:     16,
			accel:   100,
			runHold: 100,
			brake:   0.4,
			tap:     60,
			micro:   0.3,
		},
		orient: {
			debounce:  40,
			flipGrace: 30,
		},
		invincible: false,
		hits: {
			max:     10,
			current: 0,
		},
		jumps: {
			coyote: {
				time: 300,
			},
			knievel: {
				distance: 64,
				lift:     8,
			},
			fall: {
				speed: 16,
			},
			ground: {
				power: {
					min: 16,
					max: 32,
				},
				count: {
					max: 2,
				},
			},
			wall: {
				power:   18,
				lateral: 18,
				max:     1,
				time:    100,
				slide: {
					factor: 0.1,
					max:    6,
				},
			},
		},
		dash: {
			xpower:   75,
			ypower:   75,
			duration: 80,
			cooldown: 250,
			hover:    250,
			air:      true,
			ground:   false,
			limit:    3,
			reset: {
				ground: true,
				wall:   true,
			}
		},
		retries: {
			max:     10,
			current: 0,
		},
		health: {
			max:     3,
			current: 3,
		},
		colors: {
			default:  '#ffbb00',
			falling:  '#ff9900',
			walljump: '#ff6600',
			coyote:   '#ff6600',
			dash:     '#ff3300',
		},

		// Combos: name: { sequence: [ actions ], window: ms }
		combos: {
			dashLeft:  { sequence: [ 'left', 'left'  ], window: 200 },
			dashRight: { sequence: [ 'right','right' ], window: 200 },
			dashUp:    { sequence: [ 'up',   'up'    ], window: 200 },
			dashDown:  { sequence: [ 'down', 'down'  ], window: 200 },
		},
	},

	// Combos.
	combos: {
		cooldown: 30,
	},

	// Physics.
	physics: {
		gravity:  80,
		friction: 65,
		terminal: 16,
	},

	// Enemies.
	enemies: {
		maxShots: 100,
	},

	// Projectiles.
	projectiles: {
		speed: 8,
	},

	// Tiles.
	tiles: {
		players: {
			one: 'P',
		},
		doors: {
			forward: 'G',
			backward: 'B',
		},
		enemies: {
			shooter: 'e',
		},
		platforms: {
			grass: 'x',
		},
		ambient: {
			cloud: 'c',
		},
		walls: {
			rock: 'r',
		},
	},
};
