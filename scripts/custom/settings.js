// Settings
export default {

	// Defaults.
	room:      0,
	tileSize:  32,
	ppi:       300,
	gameSpeed: 60,
	hud:       true,

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
	input: {
		left:  'a',
		right: 'e',
		jump:  ' ',
		pause: 'Escape',
		enter: 'Enter',
	},

	// Physics.
	physics: {
		gravity:  80,
		friction: 65,
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
