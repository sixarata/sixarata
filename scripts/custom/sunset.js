import Sixarata from '../core/game.js';
import { Particle } from '../core/tiles/exports.js';
import { Scale, Sound } from '../core/sound/exports.js';
import { Rain } from '../core/weather/exports.js';

// Weather: Rain (optional)
const rain = new Rain( Sixarata.Room );

Sixarata.Hooks.add( 'Frame.tick',   rain.tick,   30 );
Sixarata.Hooks.add( 'Frame.render', rain.render, 30 );
Sixarata.Weather = { rain };

/**
 * This is a very primitive example of using the Hooks API
 * to show some sparkles when the player jumps.
 */
Sixarata.Hooks.add( 'Player.jump', () => {
	let particles = [],
		max       = 50;

	for ( let i = 0; i < max; i++ ) {
		particles.push(
			new Particle(
				Sixarata.Room.tiles.particles,
				Sixarata.Room.tiles.players[ 0 ],
				Sixarata.Colors.random(),
				{
					w: 0.15,
					h: 0.15,
				},
				{
					x: ( 3 * Math.random() - 1.5 ),
					y: ( 2 * Math.random() - 1.5 ),
				}
			)
		);
	}
} );

/**
 * This is a very primitive example of using the Hooks API
 * to play a sound when the player jumps.
 */
Sixarata.Hooks.add( 'Player.jump', () => {
	Sixarata.Audio.sound = new Sound( 110, 0.2, '', '', '', 100 );
	Sixarata.Audio.play();
} );
