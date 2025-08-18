// Default settings.
export default {

	// Room.
	room: {
		start: 0
	},

	// View.
	view: {
		hud: false,
	},

	// Scale.
	scale: {
		size: 32,
		dpr:  2
	},

	// Frames.
	frames: {
		throttle: 0.5,
		second:   1000,
		goal:     60,
		clamp:    5
	},

	// Player.
	player: {
		speed:      16,
		invincible: false,
		hits: {
			max:     10,
			current: 0,
		},
		jumps: {
			coyote: {
				time: 200,
			},
			fall: {
				speed: 16
			},
			ground: {
				power: 16,
				max:   1,
			},
			wall: {
				power:   18,
				lateral: 18,
				max:     1
			},
		},
		dash: {
			xpower:   60,
			duration: 60,
			ypower:   60,
			cooldown: 250,
			hover:    250,
			air:      true,
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
		}
	},

	// Player movement.
	inputs: {
		keyboard: {},
		gamepad: {},
		detect: {
			doubleTapWindow: 180 // fallback if mechanic doesn't supply
		}
	},

	// Combos: map combo name -> { sequence:[actions], window:ms }
	combos: {
		dashLeft:  { sequence: [ 'left', 'left'  ], window: 200 },
		dashRight: { sequence: [ 'right','right' ], window: 200 },
		dashUp:    { sequence: [ 'up',   'up'    ], window: 200 },
		dashDown:  { sequence: [ 'down', 'down'  ], window: 200 },
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
			backward: 'B'
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
