import Game from '../game.js';
import Settings from '../../custom/settings.js';

/**
 * The Orient mechanic.
 *
 * This mechanic updates a tile's orientation based on directional input.
 * (Currently only horizontal facing: 90 right, 270 left; Y reset to 0.)
 */
export default class Orient {

	/**
	 * Default orient settings.
	 *
	 * @type {Object}
	 */
	static defaults = {
		debounce: 40,
		flipGrace: 30,
	}

	/**
	 * Construct the Orient mechanic.
	 *
	 * @param {Tile} tile A Tile with an `orientation` property.
	 * @returns {Orient} this
	 */
	constructor(
		tile = null
	) {
		return this.set( tile );
	}

	/**
	 * Set the mechanic.
	 *
	 * @param {Tile} tile A Tile with an `orientation` property.
	 * @returns {Orient} this
	 */
	set = (
		tile = null
	) => {
		this.reset();
		this.tile = tile;

		return this;
	}

	/**
	 * Reset the mechanic.
	 *
	 * @returns {Orient} this
	 */
	reset = () => {
		this.tile      = null;
		this.settings  = Settings.player?.orient ?? Orient.defaults;
		this.listening = true;

		return this;
	}

	/**
	 * Listen for directional inputs and update orientation.
	 */
	listen = () => {

		// Skip if not listening.
		if ( ! this.listening ) {
			return;
		}

		// Skip if no tile.
		if ( ! this.tile ) {
			return;
		}

		const orientation = this.tile.physics?.orientation;
		const deb   = this.settings.debounce;
		const grace = this.settings.flipGrace;

		const holdL = Game.History.hold( 'left' );
		const holdR = Game.History.hold( 'right' );
		const edgeL = Game.History.edge( 'left' );
		const edgeR = Game.History.edge( 'right' );

		const now = performance.now();

		// Initialize trackers if missing.
		if ( this.lastFaceTime == null ) this.lastFaceTime = 0;
		if ( this.lastFaceDir  == null ) this.lastFaceDir  = orientation.x || 90;

		// Edge attempts: record but maybe defer commit under grace.
		if ( edgeL ) {
			this.pendingDir = 270;
			this.pendingTime = now;
		}
		if ( edgeR ) {
			this.pendingDir = 90;
			this.pendingTime = now;
		}

		// Opposite flick suppression: if trying to flip opposite of current within grace
		if (
			this.pendingDir != null
			&& this.pendingDir !== this.lastFaceDir
			&& ( now - this.lastFaceTime ) < grace
		) {
			// Only allow if held past debounce threshold.
			if ( this.pendingDir === 270 && holdL?.down && holdL.duration >= deb ) {
				orientation.x = 270;
				this.lastFaceDir = 270;
				this.lastFaceTime = now;
			} else if ( this.pendingDir === 90 && holdR?.down && holdR.duration >= deb ) {
				orientation.x = 90;
				this.lastFaceDir = 90;
				this.lastFaceTime = now;
			}
		} else if ( this.pendingDir != null ) {
			// Commit pending if direction held long enough OR no debounce required yet.
			if ( this.pendingDir === 270 ) {
				if ( holdL?.down && holdL.duration >= deb ) {
					orientation.x = 270;
					this.lastFaceDir = 270;
					this.lastFaceTime = now;
				}
			} else if ( this.pendingDir === 90 ) {
				if ( holdR?.down && holdR.duration >= deb ) {
					orientation.x = 90;
					this.lastFaceDir = 90;
					this.lastFaceTime = now;
				}
			}
		}

		// Fallback: if neither direction held, keep lastFaceDir (no change).
		// Reset Y each frame.
		orientation.y = 0;
	}
}
