import Game from '../game.js';
import Settings from '../../content/settings.js';
import Time from '../utilities/time.js';

/**
 * The Orient mechanic.
 *
 * This mechanic updates a tile's orientation based on directional input.
 * (Currently only horizontal facing: 90 right, 270 left; Y reset to 0.)
 */
export default class Orient {

	/**
	 * Tile whose horizontal orientation is controlled by this mechanic.
	 *
	 * @type {Tile|null}
	 */
	tile;

	/**
	 * Debounce and opposite-direction grace settings in milliseconds.
	 *
	 * @type {Object}
	 */
	settings;

	/**
	 * Whether directional input may update the Tile orientation.
	 *
	 * @type {Boolean}
	 */
	listening;

	/**
	 * Shared monotonic millisecond timestamp of the last accepted facing change.
	 *
	 * @type {Number}
	 */
	changedAt;

	/**
	 * Pending horizontal orientation in degrees, or null when none is pending.
	 *
	 * @type {Number|null}
	 */
	pending;

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
	 * Restore default mechanic state and bind one Tile.
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
	 * Restore the unbound, listening state and clear pending orientation input.
	 *
	 * @returns {Orient} this
	 */
	reset = () => {
		this.tile      = null;
		this.settings  = Settings.player?.orient ?? Orient.defaults;
		this.listening = true;
		this.changedAt = 0;
		this.pending   = null;

		return this;
	}

	/**
	 * Apply debounced horizontal input to the bound Tile's orientation.
	 *
	 * Accepted changes record the shared monotonic millisecond time in changedAt.
	 * Vertical orientation is reset even when no horizontal change is accepted.
	 *
	 * @returns {void}
	 */
	listen = () => {

		// Skip if disabled or unbound.
		if ( ! this.listening || ! this.tile ) {
			return;
		}

		const orientation = this.tile.physics?.orientation;
		const deb   = this.settings.debounce;
		const grace = this.settings.flipGrace;

		const holdL = Game.History.hold( 'left' );
		const holdR = Game.History.hold( 'right' );
		const edgeL = Game.History.edge( 'left' );
		const edgeR = Game.History.edge( 'right' );

		const now = Time.now;

		// Edge attempts: record but maybe defer commit under grace.
		if ( edgeL ) {
			this.pending = 270;
		}
		if ( edgeR ) {
			this.pending = 90;
		}

		// Suppress an opposite flick within the configured grace period.
		if (
			this.pending != null
			&& this.pending !== orientation.x
			&& ( now - this.changedAt ) < grace
		) {
			// Only allow if held past debounce threshold.
			if ( this.pending === 270 && holdL?.down && holdL.duration >= deb ) {
				orientation.x = 270;
				this.changedAt = now;
				this.pending   = null;
			} else if ( this.pending === 90 && holdR?.down && holdR.duration >= deb ) {
				orientation.x = 90;
				this.changedAt = now;
				this.pending   = null;
			}
		} else if ( this.pending != null ) {
			// Commit a pending direction after its input survives debounce.
			if ( this.pending === 270 ) {
				if ( holdL?.down && holdL.duration >= deb ) {
					orientation.x = 270;
					this.changedAt = now;
					this.pending   = null;
				}
			} else if ( this.pending === 90 ) {
				if ( holdR?.down && holdR.duration >= deb ) {
					orientation.x = 90;
					this.changedAt = now;
					this.pending   = null;
				}
			}
		}

		// Reset Y each frame.
		orientation.y = 0;
	}
}
