import Sixarata from '../core/game.js';
import { Smoke } from '../core/utilities/exports.js';
import { FluidParticle } from '../core/tiles/exports.js';
import { Fog } from '../core/weather/exports.js';

/**
 * Fluid Simulation System
 *
 * Grid-based fluid dynamics using simplified Navier-Stokes equations.
 * Perfect for smoke, dust, and atmospheric effects.
 *
 * Based on Jos Stam's "Stable Fluids" approach:
 * - Advection: transports quantities through velocity field
 * - Diffusion: spreads quantities throughout grid
 * - Projection: enforces incompressibility (mass conservation)
 *
 * Quick Start:
 *
 * 1. Create a smoke simulation:
 *    const smoke = new Smoke(64, 64, 1, { buoyancy: 0.15 });
 *
 * 2. Add effects to player actions:
 *    Sixarata.Hooks.add('Player.jump', (player) => {
 *        smoke.addDust(pos.x, pos.y, 1.5, velocity, 3);
 *    });
 *
 * 3. Update and render:
 *    Sixarata.Hooks.add('Frame.tick', () => smoke.step(0.016));
 *    Sixarata.Hooks.add('Frame.render', () => smoke.render(ctx));
 *
 * Classes:
 * - FluidGrid: Base fluid simulation (utilities/fluid.js)
 * - Smoke: Buoyancy + color support (utilities/smoke.js)
 * - FluidParticle: Particles that interact with fluids (tiles/fluid-particle.js)
 * - Fog: Atmospheric weather effect (weather/fog.js)
 *
 * Parameters to adjust:
 * - buoyancy: 0.05-0.3 (how much smoke rises)
 * - viscosity: 0.000001-0.0001 (fluid thickness)
 * - diffusion: 0.00001-0.001 (density spreading)
 * - iterations: 2-8 (solver accuracy vs speed)
 * - cellSize: Match to your game scale
 *
 * Performance tips:
 * - Lower resolution (32x32) for background effects
 * - Higher resolution (64x64) for detailed player effects
 * - Reduce iterations (2-4) for better performance
 * - Use separate grids for different effect layers
 *
 * See fluid-demo.html for interactive examples!
 */

// Create smoke and fog lazily after initialization.
let smoke = null;
let fog = null;

// Initialize fluid simulations after room is loaded.
Sixarata.Hooks.add( 'Room.loaded', () => {

	// Get room dimensions (in world units/tiles)
	const room = Sixarata.Room;
	const roomWidth = room.size.w.valueOf ? room.size.w.valueOf() : Number(room.size.w);
	const roomHeight = room.size.h.valueOf ? room.size.h.valueOf() : Number(room.size.h);

	// Limit grid size for performance (max 128x128)
	// Use a coarser grid if room is too large
	const maxGridSize = 128;
	const cellSize = Math.max(
		Math.ceil(roomWidth / maxGridSize),
		Math.ceil(roomHeight / maxGridSize),
		1
	);

	const gridWidth = Math.min(Math.ceil(roomWidth / cellSize), maxGridSize);
	const gridHeight = Math.min(Math.ceil(roomHeight / cellSize), maxGridSize);

	console.log('Fluid grid:', { roomWidth, roomHeight, cellSize, gridWidth, gridHeight });

	// Create smoke simulation sized to match the entire room
	smoke = new Smoke( gridWidth, gridHeight, 1, {
		buoyancy:   0.05,     // Less buoyancy (dust settles more)
		viscosity:  0.00001,  // Low viscosity (thin)
		diffusion:  0.00005,  // Less spreading (dust stays more concentrated)
		iterations: 4,        // Good balance
		cooling:    0.98,     // Temperature decay (for smoke/buoyancy)
		cellSize:   cellSize, // Calculated to cover room efficiently
		fade:       0.97,     // Density fade rate (faster fade to prevent ghosts)
	} );

	// Grid positioned at world origin (covers entire room)
	smoke.gridOffsetX = 0;
	smoke.gridOffsetY = 0;

	// Only create fog once (not on every room load)
	if ( !fog ) {
		// Optional: Create atmospheric fog weather effect.
		fog = new Fog( {
			enabled:    false,    // Start disabled
			density:    0.5,
			color:      { r: 0.9, g: 0.9, b: 0.95 },
			driftSpeed: { x: 0.02, y: -0.01 },
			spawnRate:  0.1,
		} );

		// Register fog hooks (if you want to use fog).
		// Uncomment to enable:
		fog.hooks();
	}

	// Export smoke and fog for use in other modules.
	Sixarata.Fluids = { smoke, fog };

	// DEBUG: Add test smoke to verify rendering works
	//console.log( 'Fluid simulation initialized', { smoke, fog, cellSize, roomWidth, roomHeight } );
}, 22 );

// Update smoke simulation each frame.
Sixarata.Hooks.add( 'Frame.tick', () => {
	if ( smoke && Sixarata.Room.tiles.players[ 0 ] ) {
		const player = Sixarata.Room.tiles.players[ 0 ];
		const pos = player.physics.position;
		const vel = player.physics.velocity;

		// Extract numeric values
		const posX = typeof pos.x.valueOf === 'function' ? pos.x.valueOf() : Number(pos.x);
		const posY = typeof pos.y.valueOf === 'function' ? pos.y.valueOf() : Number(pos.y);
		const velX = typeof vel.x.valueOf === 'function' ? vel.x.valueOf() : Number(vel.x);
		const velY = typeof vel.y.valueOf === 'function' ? vel.y.valueOf() : Number(vel.y);

		// Player disturbs smoke as they move through it
		const speed = Math.sqrt(velX * velX + velY * velY);
		if (speed > 5) {  // Only if moving fast
			// Grid now covers entire room starting at (0,0), so no offset needed
			const localX = posX - smoke.gridOffsetX;
			const localY = posY - smoke.gridOffsetY;

			// Add velocity to fluid at player position (subtle disturbance)
			smoke.addVelocity(
				localX,
				localY,
				velX * 0.1,  // Much gentler push
				velY * 0.1,
				player.physics.size.w / smoke.cellSize * 0.5  // Smaller radius
			);
		}
	}

	if ( smoke ) {
		// Step the simulation
		smoke.step( 0.016 );  // ~60 FPS
	}
}, 8 );

// Render smoke after room but before HUD.
Sixarata.Hooks.add( 'Frame.render', () => {
	if ( smoke ) {
		const ctx = Sixarata.View.buffer.context;
		const camera = Sixarata.Camera.position;

		if ( ctx && camera ) {

			// Extract camera values
			const cameraX = typeof camera.x.valueOf === 'function' ? camera.x.valueOf() : Number(camera.x);
			const cameraY = typeof camera.y.valueOf === 'function' ? camera.y.valueOf() : Number(camera.y);

			// Render smoke with proper coordinate conversion
			smoke.renderBlended(
				ctx,
				1,
				'lighter',
				{ x: cameraX, y: cameraY },
				{ x: smoke.gridOffsetX, y: smoke.gridOffsetY }
			);
		}
	}
}, 7 );

/**
 * Player Jump - Dust Cloud
 *
 * Creates a puff of dust when the player jumps.
 * Dust has brownish color and settles slowly.
 * The dust stays at the jump location and can be disturbed by movement.
 */
Sixarata.Hooks.add( 'Player.jump', () => {
	if ( !smoke ) return;

	const player = Sixarata.Room.tiles.players[ 0 ];
	if ( !player ) return;

	const pos = player.physics.position;
	const vel = player.physics.velocity;

	// Extract numeric values from Coordinate objects
	const posX = typeof pos.x.valueOf === 'function' ? pos.x.valueOf() : Number(pos.x);
	const posY = typeof pos.y.valueOf === 'function' ? pos.y.valueOf() : Number(pos.y);
	const velX = typeof vel.x.valueOf === 'function' ? vel.x.valueOf() : Number(vel.x);

	// Convert world position to grid-local position
	const localX = posX - smoke.gridOffsetX;
	const localY = posY - smoke.gridOffsetY;

	// Add dust cloud at player's feet.
	smoke.addDust(
		localX + player.physics.size.w / 2,
		localY + player.physics.size.h / 2,
		1.0,                                 // Higher density - more visible
		{
			x: -velX * 0.1,  // Very subtle horizontal movement
			y: -0.5          // Slight downward velocity (dust settles)
		},
		4                    // Larger radius
	);
} );

/**
 * Player Dash - Colored Smoke Trail
 *
 * Creates a bluish smoke trail during dash.
 * Trail follows behind the player.
 *
 * Note: Requires a 'Player.dash' hook in your dash mechanic.
 * Add this to your dash code:
 *   Sixarata.Hooks.do('Player.dash', player);
 */
Sixarata.Hooks.add( 'Player.dash', () => {
	if ( !smoke ) return;

	const player = Sixarata.Room.tiles.players[ 0 ];
	if ( !player ) return;

	const pos = player.physics.position;
	const vel = player.physics.velocity;

	// Add colored smoke with slight temperature (gentle rise).
	smoke.addSmoke(
		pos.x,
		pos.y,
		0.3,                              // Light density
		0.5,                              // Slight temperature
		{ r: 0.8, g: 0.8, b: 1.0 },       // Bluish tint
		{
			x: -vel.x * 0.3,  // Trail behind
			y: -vel.y * 0.3
		},
		2                                 // Radius
	);
} );

/**
 * Player Land - Impact Burst
 *
 * Creates a radial dust burst when landing hard.
 * Stronger impacts create bigger bursts.
 */
Sixarata.Hooks.add( 'Player.land', () => {
	if ( !smoke ) return;

	const player = Sixarata.Room.tiles.players[ 0 ];
	if ( !player ) return;

	const pos = player.physics.position;
	const vel = player.physics.velocity;

	// Calculate impact strength from fall speed.
	const impactStrength = Math.abs( vel.y );

	// Only create burst for significant impacts.
	if ( impactStrength > 5 ) {
		// Create radial dust pattern.
		const numRays = 8;
		for ( let i = 0; i < numRays; i++ ) {
			const angle = ( i / numRays ) * Math.PI * 2;
			const vx = Math.cos( angle ) * impactStrength * 0.5;
			const vy = Math.sin( angle ) * impactStrength * 0.5;

			smoke.addDust(
				pos.x,
				pos.y + player.physics.size.h / 2,
				0.5,
				{ x: vx, y: vy },
				2
			);
		}
	}
} );

/**
 * Wall Slide - Continuous Particles
 *
 * Emits dust while sliding down walls.
 *
 * Note: Requires a 'Player.wallSlide' hook or check wall slide state.
 * Example implementation:
 */
Sixarata.Hooks.add( 'Frame.tick', () => {
	if ( !smoke ) return;

	const player = Sixarata.Room.tiles.players[ 0 ];
	if ( !player ) return;

	// Check if player is wall sliding (adjust based on your mechanics).
	const isWallSliding = false; // Replace with actual check
	// Example: isWallSliding = player.state?.wallSliding || false;

	if ( isWallSliding && Math.random() < 0.3 ) {
		const pos = player.physics.position;
		const vel = player.physics.velocity;

		smoke.addDust(
			pos.x,
			pos.y,
			0.3,
			{
				x: Math.random() - 0.5,
				y: vel.y * 0.5  // Falls with player
			},
			1.5
		);
	}
}, 10 );

/**
 * Example: Fluid Particles
 *
 * Particles that interact with the fluid simulation.
 * They're pushed by fluid velocity and emit density/velocity.
 *
 * Uncomment to enable particle effects:
 */
/*
Sixarata.Hooks.add( 'Player.jump', () => {
	const player = Sixarata.Room.tiles.players[ 0 ];
	if ( !player ) return;

	const particles = Sixarata.Room.tiles.particles || [];

	// Spawn several fluid particles.
	for ( let i = 0; i < 10; i++ ) {
		const particle = new FluidParticle(
			particles,
			player,
			'Orange',
			{ w: 0.1, h: 0.1, d: 0.1 },
			{
				x: ( Math.random() - 0.5 ) * 2,
				y: -Math.random() * 2,
				z: 0
			},
			2000,  // Life (2 seconds)
			500,   // Fade
			smoke, // Fluid grid reference
			{
				fluidInfluence: 0.3,   // Pushed by fluid
				emitsFluid: true,
				emission: {
					density: 0.2,
					temperature: 1.0,
					radius: 1.5,
				}
			}
		);

		particles.push( particle );
	}
} );
*/

/**
 * Example: Disturb Fog
 *
 * Make player movement disturb atmospheric fog.
 * Only active if fog is enabled.
 */
Sixarata.Hooks.add( 'Frame.tick', () => {
	if ( !fog || !fog.enabled ) return;

	const player = Sixarata.Room.tiles.players[ 0 ];
	if ( !player ) return;

	const pos = player.physics.position;
	const vel = player.physics.velocity;

	// Only disturb if moving fast enough.
	const speed = Math.sqrt( vel.x * vel.x + vel.y * vel.y );
	if ( speed > 1.0 ) {
		fog.disturb(
			pos.x,
			pos.y,
			{ x: vel.x, y: vel.y },
			4  // Radius of disturbance
		);
	}
}, 10 );

/**
 * Advanced Examples
 *
 * 1. Multiple Smoke Grids:
 *    Create separate grids for background and foreground:
 *
 *    const bgSmoke = new Smoke(32, 32, 1);  // Lower res background
 *    const fgSmoke = new Smoke(64, 64, 1);  // Higher res foreground
 *
 * 2. Custom Colors:
 *    Add different colored smoke for different actions:
 *
 *    smoke.addSmoke(x, y, 1, 2, {r: 1, g: 0.5, b: 0}, vel, 2);  // Orange
 *    smoke.addSmoke(x, y, 1, 2, {r: 0, g: 1, b: 0}, vel, 2);    // Green
 *
 * 3. Projectile Trails:
 *    Add to projectile update loop:
 *
 *    projectiles.forEach(p => {
 *        smoke.addSmoke(
 *            p.physics.position.x,
 *            p.physics.position.y,
 *            0.2, 0.3,
 *            {r: 1, g: 0, b: 0},
 *            {x: -p.physics.velocity.x * 0.2, y: -p.physics.velocity.y * 0.2},
 *            1
 *        );
 *    });
 *
 * 4. Environmental Effects:
 *    Add ambient smoke sources:
 *
 *    // Campfire
 *    setInterval(() => {
 *        smoke.addSmoke(fireX, fireY, 0.5, 3, {r: 1, g: 0.5, b: 0}, {x: 0, y: -2}, 2);
 *    }, 100);
 *
 * 5. Explosion Effect:
 *    Create expanding ring of smoke:
 *
 *    for (let i = 0; i < 20; i++) {
 *        const angle = (i / 20) * Math.PI * 2;
 *        const speed = 15;
 *        smoke.addSmoke(
 *            explosionX, explosionY,
 *            1, 2,
 *            {r: 1, g: 0.3, b: 0},
 *            {x: Math.cos(angle) * speed, y: Math.sin(angle) * speed},
 *            3
 *        );
 *    }
 */

/**
 * Troubleshooting
 *
 * Smoke doesn't rise:
 * - Increase buoyancy (try 0.2 or 0.3)
 * - Add more temperature when emitting
 * - Check cooling isn't too high (use 0.95-0.99)
 *
 * Simulation is unstable:
 * - Reduce time step (use 0.008 instead of 0.016)
 * - Increase iterations (try 8)
 * - Lower viscosity and diffusion values
 *
 * Can't see smoke:
 * - Increase emission density (try 2.0 or 3.0)
 * - Check blend mode is 'lighter' or 'source-over'
 * - Verify rendering happens after room background
 *
 * Performance issues:
 * - Lower grid resolution to 32x32
 * - Reduce iteration count to 2
 * - Update at 30 FPS instead of 60
 * - Use smaller emission radius (1-2 instead of 3-4)
 *
 * Particles not interacting:
 * - Verify fluidGrid reference is passed to FluidParticle
 * - Check fluidInfluence is > 0
 * - Ensure emitsFluid is true
 * - Verify particle position is within grid bounds
 */
