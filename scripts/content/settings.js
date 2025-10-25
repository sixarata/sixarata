// Default settings.
export default {

	// Debug.
	debug: false,

	// Interfaces.
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
		invincible: false,
		move: {
			base:       1,
			speed:      10,
			run:        16,
			accel:      100,
			runHold:    100,
			multiplier: 0.4,
			duration:   60,
			factor:     0.3,
		},
		orient: {
			debounce:  40,
			flipGrace: 30,
		},
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
				speed:    16,
				terminal: 16,
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
			},
		},
		dash: {
			limit: 3,
			times: {
				duration: 80,
				cooldown: 250,
				hover:    250,
			},
			can: {
				air:    true,
				ground: false,
				wall:   true,
			},
			power: {
				x: 75,
				y: 75,
			},
			reset: {
				ground: true,
				wall:   true,
			},
		},
		wall: {
			grab: {
				stamina: {
					max:   2000,
					drain: 1,
					delay: 500,
					rate:  2,
				},
			},
			slide: {
				factor: 0.5,
				max:    6,
			},
			climb: {
				speed: 10,
				accel: 0.25,
				max:   10,
			},
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
			wallgrab: '#ff8800',
			walljump: '#ff6600',
			climb:    '#ff6600',
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

	// Controls.
	controls: {
		history: {
			max: 256,
		},
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
