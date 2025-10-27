import { Point, Velocity } from '../physics/exports.js';

/**
 * The Fluid class.
 *
 * A grid-based fluid simulation using simplified Navier-Stokes equations.
 * Implements velocity advection, diffusion, and pressure projection for
 * realistic fluid behavior suitable for smoke, dust, and other effects.
 *
 * Based on Jos Stam's "Stable Fluids" approach:
 * - Advection: transports quantities through the velocity field
 * - Diffusion: spreads quantities throughout the grid
 * - Projection: enforces incompressibility (mass conservation)
 *
 * @see https://www.cs.ubc.ca/~rbridson/fluidsimulation/
 * @see http://graphics.cs.cmu.edu/nsp/course/15-464/Fall09/papers/StamFluidforGames.pdf
 */
export default class Fluid {

	/**
	 * Grid dimensions.
	 *
	 * @type {Object}
	 */
	width = 64;
	height = 64;
	depth = 1;

	/**
	 * Grid cell size (world units per cell).
	 *
	 * @type {Number}
	 */
	cellSize = 1.0;

	/**
	 * Physics parameters.
	 *
	 * @type {Number}
	 */
	viscosity = 0.0001;  // Fluid viscosity (diffusion rate)
	diffusion = 0.0001;  // Density diffusion rate
	dt = 0.016;          // Time step (typically frame delta)
	fade = 0.99;         // Density fade rate per frame (0-1)

	/**
	 * Iteration (Gauss-Seidel) counts for solver convergence.
	 *
	 * @type {Number}
	 */
	iterations = 4;

	/**
	 * Fluid state arrays.
	 * Using separate arrays for current and previous state.
	 *
	 * @type {Float32Array}
	 */
	density = null;      // Current density field
	density0 = null;     // Previous density field

	velocityX = null;    // Current X velocity field
	velocityY = null;    // Current Y velocity field
	velocityX0 = null;   // Previous X velocity field
	velocityY0 = null;   // Previous Y velocity field

	pressure = null;     // Pressure field (for projection)
	divergence = null;   // Divergence field (for projection)

	/**
	 * Construct the Fluid.
	 *
	 * @param {Number} width  Grid width in cells. Default 64.
	 * @param {Number} height Grid height in cells. Default 64.
	 * @param {Number} depth  Grid depth in cells. Default 1.
	 * @param {Object} options Additional configuration options.
	 */
	constructor(
		width = 64,
		height = 64,
		depth = 1,
		options = {}
	) {
		this.width = width;
		this.height = height;
		this.depth = depth;

		// Apply options.
		Object.assign( this, options );

		// Initialize.
		return this.set();
	}

	/**
	 * Initialize the fluid grid.
	 *
	 * @returns {Fluid}
	 */
	set = () => {
		this.reset();
		return this;
	}

	/**
	 * Reset and allocate fluid arrays.
	 *
	 * @returns {Fluid}
	 */
	reset = () => {
		const size = this.width * this.height * this.depth;

		// Allocate typed arrays for performance.
		this.density = new Float32Array( size );
		this.density0 = new Float32Array( size );

		this.velocityX = new Float32Array( size );
		this.velocityY = new Float32Array( size );
		this.velocityX0 = new Float32Array( size );
		this.velocityY0 = new Float32Array( size );

		this.pressure = new Float32Array( size );
		this.divergence = new Float32Array( size );

		return this;
	}

	/**
	 * Convert 3D coordinates to 1D array index.
	 *
	 * @param   {Number} x Grid X coordinate.
	 * @param   {Number} y Grid Y coordinate.
	 * @param   {Number} z Grid Z coordinate. Default 0.
	 * @returns {Number} Array index.
	 */
	index = (
        x,
        y,
        z = 0
    ) => {

		// Clamp coordinates to grid bounds.
		x = Math.max( 0, Math.min( this.width - 1, Math.floor( x ) ) );
		y = Math.max( 0, Math.min( this.height - 1, Math.floor( y ) ) );
		z = Math.max( 0, Math.min( this.depth - 1, Math.floor( z ) ) );

		return x + y * this.width + z * this.width * this.height;
	}

	/**
	 * Add density to the grid at a position.
	 *
	 * @param {Number} x      World X position.
	 * @param {Number} y      World Y position.
	 * @param {Number} amount Density amount to add.
	 * @param {Number} radius Radius of influence. Default 1.
	 * @returns {Fluid}
	 */
	addDensity = (
        x,
        y,
        amount,
        radius = 1
    ) => {

		// Convert world coordinates to grid coordinates.
		const gx = Math.floor( x / this.cellSize );
		const gy = Math.floor( y / this.cellSize );

		// Add density in a radius.
		const r = Math.ceil( radius );
		for ( let dy = -r; dy <= r; dy++ ) {
			for ( let dx = -r; dx <= r; dx++ ) {
				const dist = Math.sqrt( dx * dx + dy * dy );
				if ( dist <= radius ) {
					const idx = this.index( gx + dx, gy + dy );
					const falloff = 1.0 - ( dist / radius );
					this.density[ idx ] += amount * falloff;
				}
			}
		}

		return this;
	}

	/**
	 * Add velocity to the grid at a position.
	 *
	 * @param {Number} x       World X position.
	 * @param {Number} y       World Y position.
	 * @param {Number} vx      X velocity to add.
	 * @param {Number} vy      Y velocity to add.
	 * @param {Number} radius  Radius of influence. Default 1.
	 * @returns {Fluid}
	 */
	addVelocity = (
        x,
        y,
        vx,
        vy,
        radius = 1
    ) => {

		// Convert world coordinates to grid coordinates.
		const gx = Math.floor( x / this.cellSize );
		const gy = Math.floor( y / this.cellSize );

		// Add velocity in a radius.
		const r = Math.ceil( radius );
		for ( let dy = -r; dy <= r; dy++ ) {
			for ( let dx = -r; dx <= r; dx++ ) {
				const dist = Math.sqrt( dx * dx + dy * dy );
				if ( dist <= radius ) {
					const idx = this.index( gx + dx, gy + dy );
					const falloff = 1.0 - ( dist / radius );
					this.velocityX[ idx ] += vx * falloff;
					this.velocityY[ idx ] += vy * falloff;
				}
			}
		}

		return this;
	}

	/**
	 * Add a source at a point (density + velocity).
	 *
	 * @param {Object} point    Point with x, y properties.
	 * @param {Object} velocity Velocity with x, y properties.
	 * @param {Number} density  Density amount.
	 * @param {Number} radius   Radius of influence. Default 2.
	 * @returns {Fluid}
	 */
	addSource = (
        point,
        velocity,
        density,
        radius = 2
    ) => {
		this.addDensity( point.x, point.y, density, radius );
		this.addVelocity( point.x, point.y, velocity.x, velocity.y, radius );
		return this;
	}

	/**
	 * Step the fluid simulation forward in time.
	 *
	 * @param {Number} dt Time delta in seconds. Default uses this.dt.
	 * @returns {Fluid}
	 */
	step = (
        dt = this.dt
    ) => {

		// Store dt for use in sub-methods.
		this.dt = dt;

		// Velocity step: diffuse, project, advect, project.
		this.diffuseVelocity();
		this.project();
		this.advectVelocity();
		this.project();

		// Density step: diffuse and advect.
		this.diffuseDensity();
		this.advectDensity();

		// Apply fade/decay to density.
		this.fadeDensity( this.fade );

        // Return this for chaining.
		return this;
	}

	/**
	 * Diffuse velocity field (viscosity).
	 *
	 * @returns {Fluid}
	 */
	diffuseVelocity = () => {
		this.diffuse( this.velocityX0, this.velocityX, this.viscosity );
		this.diffuse( this.velocityY0, this.velocityY, this.viscosity );

		// Swap arrays.
		[ this.velocityX, this.velocityX0 ] = [ this.velocityX0, this.velocityX ];
		[ this.velocityY, this.velocityY0 ] = [ this.velocityY0, this.velocityY ];

        // Return this for chaining.
		return this;
	}

	/**
	 * Advect velocity field through itself.
	 *
	 * @returns {Fluid}
	 */
	advectVelocity = () => {
		this.advect( this.velocityX0, this.velocityX, this.velocityX0, this.velocityY0 );
		this.advect( this.velocityY0, this.velocityY, this.velocityX0, this.velocityY0 );

		// Swap arrays.
		[ this.velocityX, this.velocityX0 ] = [ this.velocityX0, this.velocityX ];
		[ this.velocityY, this.velocityY0 ] = [ this.velocityY0, this.velocityY ];

        // Return this for chaining.
		return this;
	}

	/**
	 * Diffuse density field.
	 *
	 * @returns {Fluid}
	 */
	diffuseDensity = () => {
		this.diffuse( this.density0, this.density, this.diffusion );

		// Swap arrays.
		[ this.density, this.density0 ] = [ this.density0, this.density ];

        // Return this for chaining.
		return this;
	}

	/**
	 * Advect density field through velocity field.
	 *
	 * @returns {Fluid}
	 */
	advectDensity = () => {
		this.advect( this.density0, this.density, this.velocityX, this.velocityY );

		// Swap arrays.
		[ this.density, this.density0 ] = [ this.density0, this.density ];

        // Return this for chaining.
		return this;
	}

	/**
	 * Diffuse a field using Gauss-Seidel relaxation.
	 * Implements implicit diffusion for stability.
	 *
	 * @param {Float32Array} target Target field to write to.
	 * @param {Float32Array} source Source field to read from.
	 * @param {Number}       rate   Diffusion rate.
	 * @returns {Fluid}
	 */
	diffuse = ( target, source, rate ) => {
		const a = this.dt * rate * this.width * this.height;

		// Gauss-Seidel relaxation.
		for ( let k = 0; k < this.iterations; k++ ) {
			for ( let y = 1; y < this.height - 1; y++ ) {
				for ( let x = 1; x < this.width - 1; x++ ) {
					const idx = this.index( x, y );
					const left = this.index( x - 1, y );
					const right = this.index( x + 1, y );
					const up = this.index( x, y - 1 );
					const down = this.index( x, y + 1 );

					target[ idx ] = (
						source[ idx ] +
						a * (
							target[ left ] +
							target[ right ] +
							target[ up ] +
							target[ down ]
						)
					) / ( 1 + 4 * a );
				}
			}
			this.setBoundary( target );
		}

        // Return this for chaining.
		return this;
	}

	/**
	 * Advect a field through a velocity field using semi-Lagrangian method.
	 * Traces particles backward in time and interpolates values.
	 *
	 * @param {Float32Array} target Target field to write to.
	 * @param {Float32Array} source Source field to read from.
	 * @param {Float32Array} vx     X velocity field.
	 * @param {Float32Array} vy     Y velocity field.
	 * @returns {Fluid}
	 */
	advect = ( target, source, vx, vy ) => {
		const dt0 = this.dt * this.width;

		for ( let y = 1; y < this.height - 1; y++ ) {
			for ( let x = 1; x < this.width - 1; x++ ) {
				const idx = this.index( x, y );

				// Backtrace particle position.
				let bx = x - dt0 * vx[ idx ];
				let by = y - dt0 * vy[ idx ];

				// Clamp to grid bounds.
				bx = Math.max( 0.5, Math.min( this.width - 1.5, bx ) );
				by = Math.max( 0.5, Math.min( this.height - 1.5, by ) );

				// Bilinear interpolation.
				const x0 = Math.floor( bx );
				const x1 = x0 + 1;
				const y0 = Math.floor( by );
				const y1 = y0 + 1;

				const sx = bx - x0;
				const sy = by - y0;
				const tx = 1 - sx;
				const ty = 1 - sy;

				target[ idx ] =
					tx * ty * source[ this.index( x0, y0 ) ] +
					sx * ty * source[ this.index( x1, y0 ) ] +
					tx * sy * source[ this.index( x0, y1 ) ] +
					sx * sy * source[ this.index( x1, y1 ) ];
			}
		}

		this.setBoundary( target );

        // Return this for chaining.
		return this;
	}

	/**
	 * Project velocity field to be divergence-free.
	 * Enforces incompressibility (mass conservation).
	 *
	 * @returns {Fluid}
	 */
	project = () => {
		const h = 1.0 / this.width;

		// Calculate divergence.
		for ( let y = 1; y < this.height - 1; y++ ) {
			for ( let x = 1; x < this.width - 1; x++ ) {
				const idx = this.index( x, y );
				const left = this.index( x - 1, y );
				const right = this.index( x + 1, y );
				const up = this.index( x, y - 1 );
				const down = this.index( x, y + 1 );

				this.divergence[ idx ] = -0.5 * h * (
					this.velocityX[ right ] - this.velocityX[ left ] +
					this.velocityY[ down ] - this.velocityY[ up ]
				);

				this.pressure[ idx ] = 0;
			}
		}

		this.setBoundary( this.divergence );
		this.setBoundary( this.pressure );

		// Solve for pressure using Gauss-Seidel.
		for ( let k = 0; k < this.iterations; k++ ) {
			for ( let y = 1; y < this.height - 1; y++ ) {
				for ( let x = 1; x < this.width - 1; x++ ) {
					const idx = this.index( x, y );
					const left = this.index( x - 1, y );
					const right = this.index( x + 1, y );
					const up = this.index( x, y - 1 );
					const down = this.index( x, y + 1 );

					this.pressure[ idx ] = (
						this.divergence[ idx ] +
						this.pressure[ left ] +
						this.pressure[ right ] +
						this.pressure[ up ] +
						this.pressure[ down ]
					) / 4;
				}
			}
			this.setBoundary( this.pressure );
		}

		// Subtract pressure gradient from velocity.
		for ( let y = 1; y < this.height - 1; y++ ) {
			for ( let x = 1; x < this.width - 1; x++ ) {
				const idx = this.index( x, y );
				const left = this.index( x - 1, y );
				const right = this.index( x + 1, y );
				const up = this.index( x, y - 1 );
				const down = this.index( x, y + 1 );

				this.velocityX[ idx ] -= 0.5 * ( this.pressure[ right ] - this.pressure[ left ] ) / h;
				this.velocityY[ idx ] -= 0.5 * ( this.pressure[ down ] - this.pressure[ up ] ) / h;
			}
		}

		this.setBoundary( this.velocityX );
		this.setBoundary( this.velocityY );

        // Return this for chaining.
		return this;
	}

	/**
	 * Set boundary conditions (no-slip walls).
	 *
	 * @param {Float32Array} field Field to apply boundaries to.
	 * @returns {Fluid}
	 */
	setBoundary = ( field ) => {

		// Left and right walls.
		for ( let y = 1; y < this.height - 1; y++ ) {
			field[ this.index( 0, y ) ] = field[ this.index( 1, y ) ];
			field[ this.index( this.width - 1, y ) ] = field[ this.index( this.width - 2, y ) ];
		}

		// Top and bottom walls.
		for ( let x = 1; x < this.width - 1; x++ ) {
			field[ this.index( x, 0 ) ] = field[ this.index( x, 1 ) ];
			field[ this.index( x, this.height - 1 ) ] = field[ this.index( x, this.height - 2 ) ];
		}

		// Corners.
		field[ this.index( 0, 0 ) ] = 0.5 * (
			field[ this.index( 1, 0 ) ] +
			field[ this.index( 0, 1 ) ]
		);
		field[ this.index( 0, this.height - 1 ) ] = 0.5 * (
			field[ this.index( 1, this.height - 1 ) ] +
			field[ this.index( 0, this.height - 2 ) ]
		);
		field[ this.index( this.width - 1, 0 ) ] = 0.5 * (
			field[ this.index( this.width - 2, 0 ) ] +
			field[ this.index( this.width - 1, 1 ) ]
		);
		field[ this.index( this.width - 1, this.height - 1 ) ] = 0.5 * (
			field[ this.index( this.width - 2, this.height - 1 ) ] +
			field[ this.index( this.width - 1, this.height - 2 ) ]
		);

        // Return this for chaining.
		return this;
	}

	/**
	 * Fade density over time.
	 *
	 * @param {Number} factor Fade factor (0-1). Default 0.99.
	 * @param {Number} threshold Minimum density threshold. Values below this are cleared. Default 0.001.
	 * @returns {Fluid}
	 */
	fadeDensity = (
        factor = 0.99,
        threshold = 0.001
    ) => {

        // Apply fade factor and clear values below threshold.
		for ( let i = 0; i < this.density.length; i++ ) {
			this.density[ i ] *= factor;

			// Clear very low density values to prevent ghost images.
			if ( this.density[ i ] < threshold ) {
				this.density[ i ] = 0;
			}
		}

        // Return this for chaining.
		return this;
	}

	/**
	 * Clear all fields.
	 *
	 * @returns {Fluid}
	 */
	clear = () => {
		this.density.fill( 0 );
		this.density0.fill( 0 );
		this.velocityX.fill( 0 );
		this.velocityY.fill( 0 );
		this.velocityX0.fill( 0 );
		this.velocityY0.fill( 0 );
		this.pressure.fill( 0 );
		this.divergence.fill( 0 );

        // Return this for chaining.
		return this;
	}

	/**
	 * Get density at world position with interpolation.
	 *
	 * @param   {Number} x World X position.
	 * @param   {Number} y World Y position.
	 * @returns {Number} Interpolated density value.
	 */
	getDensityAt = ( x, y ) => {

		// Convert to grid coordinates.
		const gx = x / this.cellSize;
		const gy = y / this.cellSize;

		// Clamp to bounds.
		if ( gx < 0 || gx >= this.width - 1 || gy < 0 || gy >= this.height - 1 ) {
			return 0;
		}

		// Bilinear interpolation.
		const x0 = Math.floor( gx );
		const x1 = x0 + 1;
		const y0 = Math.floor( gy );
		const y1 = y0 + 1;

		const sx = gx - x0;
		const sy = gy - y0;
		const tx = 1 - sx;
		const ty = 1 - sy;

		return (
			tx * ty * this.density[ this.index( x0, y0 ) ] +
			sx * ty * this.density[ this.index( x1, y0 ) ] +
			tx * sy * this.density[ this.index( x0, y1 ) ] +
			sx * sy * this.density[ this.index( x1, y1 ) ]
		);
	}

	/**
	 * Get velocity at world position with interpolation.
	 *
	 * @param   {Number} x World X position.
	 * @param   {Number} y World Y position.
	 * @returns {Object} Velocity object with x, y properties.
	 */
	getVelocityAt = ( x, y ) => {

		// Convert to grid coordinates.
		const gx = x / this.cellSize;
		const gy = y / this.cellSize;

		// Clamp to bounds.
		if ( gx < 0 || gx >= this.width - 1 || gy < 0 || gy >= this.height - 1 ) {
			return { x: 0, y: 0 };
		}

		// Bilinear interpolation.
		const x0 = Math.floor( gx );
		const x1 = x0 + 1;
		const y0 = Math.floor( gy );
		const y1 = y0 + 1;

		const sx = gx - x0;
		const sy = gy - y0;
		const tx = 1 - sx;
		const ty = 1 - sy;

		const vx = (
			tx * ty * this.velocityX[ this.index( x0, y0 ) ] +
			sx * ty * this.velocityX[ this.index( x1, y0 ) ] +
			tx * sy * this.velocityX[ this.index( x0, y1 ) ] +
			sx * sy * this.velocityX[ this.index( x1, y1 ) ]
		);

		const vy = (
			tx * ty * this.velocityY[ this.index( x0, y0 ) ] +
			sx * ty * this.velocityY[ this.index( x1, y0 ) ] +
			tx * sy * this.velocityY[ this.index( x0, y1 ) ] +
			sx * sy * this.velocityY[ this.index( x1, y1 ) ]
		);

		return { x: vx, y: vy };
	}

	/**
	 * Render the fluid grid to a canvas context.
	 * Useful for debugging and visualization.
	 *
	 * @param {CanvasRenderingContext2D} ctx    Canvas context.
	 * @param {Number}                   scale  Scale factor. Default 1.
	 * @param {String}                   mode   Render mode: 'density', 'velocity', 'both'. Default 'density'.
	 * @returns {Fluid}
	 */
	render = ( ctx, scale = 1, mode = 'density' ) => {
		const cellW = ( ctx.canvas.width / this.width ) * scale;
		const cellH = ( ctx.canvas.height / this.height ) * scale;

		for ( let y = 0; y < this.height; y++ ) {
			for ( let x = 0; x < this.width; x++ ) {
				const idx = this.index( x, y );

				if ( mode === 'density' || mode === 'both' ) {
					const d = Math.min( 255, Math.floor( this.density[ idx ] * 255 ) );
					ctx.fillStyle = `rgba(255, 255, 255, ${d / 255})`;
					ctx.fillRect( x * cellW, y * cellH, cellW, cellH );
				}

				if ( mode === 'velocity' || mode === 'both' ) {
					const vx = this.velocityX[ idx ];
					const vy = this.velocityY[ idx ];
					const mag = Math.sqrt( vx * vx + vy * vy );

					if ( mag > 0.01 ) {
						ctx.strokeStyle = `rgba(255, 0, 0, 0.5)`;
						ctx.beginPath();
						ctx.moveTo( ( x + 0.5 ) * cellW, ( y + 0.5 ) * cellH );
						ctx.lineTo(
							( x + 0.5 + vx * 0.5 ) * cellW,
							( y + 0.5 + vy * 0.5 ) * cellH
						);
						ctx.stroke();
					}
				}
			}
		}

        // Return this for chaining.
		return this;
	}
}
