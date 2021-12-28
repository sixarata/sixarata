import { Particle } from '../core/tiles/exports.js';

/**
 * This is a very primitive example of using the Hooks API
 * to show some sparkles when the player jumps.
 */
Sixarata.Hooks.add( 'Player.jump', () => {
	let particles = [],
		max       = 8;

	for ( let i = 0; i < max; i++ ) {
		particles.push(
			new Particle(
				Sixarata.Room.tiles.particles,
				Sixarata.Room.tiles.players[ 0 ],
				Sixarata.Colors.cloud(),
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
