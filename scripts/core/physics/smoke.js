import Fluid from './fluid.js';
/**
 * The Smoke class.
 *
 * Specialized fluid simulation for smoke and dust effects.
 * Extends Fluid with features like:
 * - Buoyancy (smoke rises)
 * - Temperature-based behavior
 * - Particle emission helpers
 * - Color/opacity management
 */
export default class Smoke extends Fluid {

	/**
	 * Smoke-specific parameters.
	 *
	 * @type {Object}
	 */
	buoyancy = 0.1;          // Upward force based on temperature
	ambientTemp = 0.0;       // Ambient temperature
	cooling = 0.98;          // Temperature decay rate
	vorticity = 0.0;         // Vorticity confinement (adds swirl)

	/**
	 * Temperature field (affects buoyancy).
	 *
	 * @type {Float32Array}
	 */
	temperature = null;
	temperature0 = null;

	/**
	 * Color channels for rendering.
	 *
	 * @type {Float32Array}
	 */
	colorR = null;
	colorG = null;
	colorB = null;

	/**
	 * Construct the Smoke simulation.
	 *
	 * @param {Number} width   Grid width. Default 64.
	 * @param {Number} height  Grid height. Default 64.
	 * @param {Number} depth   Grid depth. Default 1.
	 * @param {Object} options Additional options.
	 */
	constructor(
		width = 64,
		height = 64,
		depth = 1,
		options = {}
	) {
		// Set smoke-friendly defaults.
		const smokeDefaults = {
			viscosity: 0.00001,
			diffusion: 0.0001,
			iterations: 4,
			buoyancy: 0.1,
			cooling: 0.98,
			vorticity: 1.0,
		}

		super(width, height, depth, { ...smokeDefaults, ...options });


		// Initialize smoke-specific arrays after parent construction.
		const size = this.width * this.height * this.depth;
		this.temperature = new Float32Array(size);
		this.temperature0 = new Float32Array(size);

		this.colorR = new Float32Array(size);
		this.colorG = new Float32Array(size);
		this.colorB = new Float32Array(size);

	}

	/**
	 * Reset and allocate arrays including temperature and color.
	 *
	 * @returns {Smoke}
	 */
	reset = () => {

		// Parent reset.
		super.reset();

		// Allocate smoke-specific arrays.
		const size = this.width * this.height * this.depth;

		this.temperature = new Float32Array(size);
		this.temperature0 = new Float32Array(size);

		this.colorR = new Float32Array(size);
		this.colorG = new Float32Array(size);
		this.colorB = new Float32Array(size);


		return this;
	}

	/**
	 * Add smoke at a position with temperature and color.
	 *
	 * @param {Number} x           World X position.
	 * @param {Number} y           World Y position.
	 * @param {Number} density     Density amount.
	 * @param {Number} temperature Temperature amount.
	 * @param {Object} color       RGB color {r, g, b} (0-1 range).
	 * @param {Object} velocity    Velocity {x, y}.
	 * @param {Number} radius      Radius of influence. Default 2.
	 * @returns {Smoke}
	 */
	addSmoke = (
		x,
		y,
		density = 1.0,
		temperature = 1.0,
		color = { r: 1, g: 1, b: 1 },
		velocity = { x: 0, y: 0 },
		radius = 2
	) => {

		density = Number( density );
		temperature = Number( temperature );
		velocity = {
			x: Number( velocity?.x ?? 0 ),
			y: Number( velocity?.y ?? 0 ),
		};

		// Convert world to grid coordinates.
		const gx = Math.floor(x / this.cellSize);
		const gy = Math.floor(y / this.cellSize);


		// Add in a radius.
		const r = Math.ceil(radius);
		for (let dy = -r; dy <= r; dy++) {
			for (let dx = -r; dx <= r; dx++) {
				const dist = Math.sqrt(dx * dx + dy * dy);
				if (dist <= radius) {
					const idx = this.index(gx + dx, gy + dy);
					const falloff = 1.0 - (dist / radius);

					// Add density and temperature.
					this.density[idx] += density * falloff;
					this.temperature[idx] += temperature * falloff;

					// Add velocity.
					this.velocityX[idx] += velocity.x * falloff;
					this.velocityY[idx] += velocity.y * falloff;

					// Blend colors.
					const existing = this.density[idx] - density * falloff;
					const total = this.density[idx];
					if (total > 0) {
						this.colorR[idx] = (this.colorR[idx] * existing + color.r * density * falloff) / total;
						this.colorG[idx] = (this.colorG[idx] * existing + color.g * density * falloff) / total;
						this.colorB[idx] = (this.colorB[idx] * existing + color.b * density * falloff) / total;
					}
				}
			}
		}

		return this;
	}

	/**
	 * Add dust effect (smoke with downward velocity and brownish color).
	 *
	 * @param {Number} x        World X position.
	 * @param {Number} y        World Y position.
	 * @param {Number} density  Density amount.
	 * @param {Object} velocity Initial velocity.
	 * @param {Number} radius   Radius of influence. Default 2.
	 * @returns {Smoke}
	 */
	addDust = (
		x,
		y,
		density = 0.5,
		velocity = { x: 0, y: 0.1 },
		radius = 2
	) => {

		// Dust is brownish and settles downward.
		const dustColor = { r: 0.6, g: 0.5, b: 0.4 };

		// Return this smoke.
		return this.addSmoke(
			x,
			y,
			density,
			0.0,  // No temperature (doesn't rise)
			dustColor,
			velocity,
			radius
		);

	}

	/**
	 * Step the smoke simulation with buoyancy.
	 *
	 * @param {Number} dt Time delta.
	 * @returns {Smoke}
	 */
	step = (
		dt = this.dt
	) => {
		this.dt = dt;

		// Apply buoyancy force based on temperature.
		this.applyBuoyancy();

		// Diffuse and advect temperature.
		this.diffuse(this.temperature0, this.temperature, this.diffusion);
		[this.temperature, this.temperature0] = [this.temperature0, this.temperature];

		this.advect(this.temperature0, this.temperature, this.velocityX, this.velocityY);
		[this.temperature, this.temperature0] = [this.temperature0, this.temperature];


		// Cool temperature over time.
		this.coolTemperature();

		// Advect colors.
		this.advectColors();

		// Parent step logic (velocity and density) - inlined since super.step() doesn't work with arrow functions.
		// Velocity step: diffuse, project, advect, project.
		this.diffuseVelocity();
		this.project();
		this.advectVelocity();
		this.project();

		// Density step: diffuse and advect.
		this.diffuseDensity();
		this.advectDensity();

		// Apply fade/decay to density using configured fade rate.
		this.fadeDensity(this.fade);


		// Return this for chaining.
		return this;
	}

	/**
	 * Apply buoyancy force to velocity based on temperature.
	 *
	 * @returns {Smoke}
	 */
	applyBuoyancy = () => {
		for (let y = 1; y < this.height - 1; y++) {
			for (let x = 1; x < this.width - 1; x++) {
				const idx = this.index(x, y);
				const temp = this.temperature[idx];
				const d = this.density[idx];

					// Buoyant acceleration proportional to temperature and density.
					if (d > 0.01 && temp > this.ambientTemp) {
						this.velocityY[idx] -= this.buoyancy * (temp - this.ambientTemp) * d * this.dt;
				}
			}
		}

		// Return this for chaining.
		return this;
	}

	/**
	 * Cool temperature toward ambient.
	 *
	 * @returns {Smoke}
	 */
	coolTemperature = () => {
		for (let i = 0; i < this.temperature.length; i++) {
			this.temperature[i] = this.ambientTemp + (this.temperature[i] - this.ambientTemp) * this.cooling;
		}


		// Return this for chaining.
		return this;
	}

	/**
	 * Advect color channels through velocity field.
	 *
	 * @returns {Smoke}
	 */
	advectColors = () => {
		const colorR0 = new Float32Array(this.colorR);
		const colorG0 = new Float32Array(this.colorG);
		const colorB0 = new Float32Array(this.colorB);

		this.advect(colorR0, this.colorR, this.velocityX, this.velocityY);
		this.advect(colorG0, this.colorG, this.velocityX, this.velocityY);
		this.advect(colorB0, this.colorB, this.velocityX, this.velocityY);


		// Return this for chaining.
		return this;
	}

	/**
	 * Fade density and clear associated arrays (temperature, color) for low density cells.
	 * Overrides parent to also clear smoke-specific arrays.
	 *
	 * @param {Number} factor Fade factor (0-1). Default 0.99.
	 * @param {Number} threshold Minimum density threshold. Values below this are cleared. Default 0.001.
	 * @returns {Smoke}
	 */
	fadeDensity = (
		factor = 0.99,
		threshold = 0.001
	) => {

		// Apply fade factor and clear values below threshold.
		for (let i = 0; i < this.density.length; i++) {
			this.density[i] *= factor;

			// Clear very low density values AND associated data to prevent ghost images.
			if (this.density[i] < threshold) {
				this.density[i] = 0;
				this.temperature[i] = this.ambientTemp;
				this.colorR[i] = 0;
				this.colorG[i] = 0;
				this.colorB[i] = 0;
			}
		}

		// Return this for chaining.
		return this;
	}

	/**
	 * Clear all fields including temperature and color.
	 *
	 * @returns {Smoke}
	 */
	clear = () => {
		super.clear();

		// Clear smoke-specific arrays.
		this.temperature.fill(0);
		this.temperature0.fill(0);
		this.colorR.fill(1);
		this.colorG.fill(1);
		this.colorB.fill(1);


		// Return this for chaining.
		return this;
	}

	/**
	 * Render smoke with color to canvas.
	 *
	 * @param {CanvasRenderingContext2D} ctx         Canvas context.
	 * @param {Number}                   scale       Scale factor. Default 1.
	 * @param {Object}                   cameraPos   Camera position {x, y}. Default {x:0, y:0}.
	 * @param {Object}                   gridOffset  Grid offset in world space {x, y}. Default {x:0, y:0}.
	 * @returns {Smoke}
	 */
	render = (
		ctx,
		scale = 1,
		cameraPos = { x: 0, y: 0 },
		gridOffset = { x: 0, y: 0 }
	) => {
		const cellW = this.cellSize * scale;
		const cellH = this.cellSize * scale;

		for (let y = 0; y < this.height; y++) {
			for (let x = 0; x < this.width; x++) {
				const idx = this.index(x, y);
				const d = this.density[idx];

				if (d > 0.01) {
					const alpha = Math.min(1, d);
					const r = Math.floor(this.colorR[idx] * 255);
					const g = Math.floor(this.colorG[idx] * 255);
					const b = Math.floor(this.colorB[idx] * 255);

					// Convert grid coordinates to world coordinates (add grid offset)
					// Then subtract camera position to get screen coordinates
					const worldX = (x * this.cellSize) + gridOffset.x;
					const worldY = (y * this.cellSize) + gridOffset.y;
					const screenX = (worldX - cameraPos.x) * scale;
					const screenY = (worldY - cameraPos.y) * scale;

					ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`;
					ctx.fillRect(screenX, screenY, cellW, cellH);
				}
			}
		}


		// Return this for chaining.
		return this;
	}

	/**
	 * Render smoke with blend mode for better visuals.
	 *
	 * @param {CanvasRenderingContext2D} ctx        Canvas context.
	 * @param {Number}                   scale      Scale factor. Default 1.
	 * @param {String}                   blendMode  Blend mode. Default 'lighter'.
	 * @param {Object}                   cameraPos  Camera position {x, y}. Default {x:0, y:0}.
	 * @param {Object}                   gridOffset Grid offset in world space {x, y}. Default {x:0, y:0}.
	 * @returns {Smoke}
	 */
	renderBlended = (
		ctx,
		scale = 1,
		blendMode = 'lighter',
		cameraPos = { x: 0, y: 0 },
		gridOffset = { x: 0, y: 0 }
	) => {
		const oldBlend = ctx.globalCompositeOperation;

		ctx.globalCompositeOperation = blendMode;
		this.render(ctx, scale, cameraPos, gridOffset);
		ctx.globalCompositeOperation = oldBlend;


		// Return this for chaining.
		return this;
	}
}
