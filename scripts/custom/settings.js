// Settings
export default {

	// Defaults.
	room:      0,
	tileSize:  32,
	ppi:       300,
	gameSpeed: 60,
	hud:       false,

	// Player.
	player: {
		speed:      16,
		invincible: false,
		hits: {
			max:     10,
			current: 0,
		},
		jumps: {
			power:   16,
			max:     1,
			current: 1,
			fall:    true,
			wall:    true,
			coyote: {
				time: 200,
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
			walljump: '#ff6600',
		}
	},

	// Player movement.
	inputs: {
		keyboard: {},
		gamepad: {},
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
