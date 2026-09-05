import Game from '../core/game.js';
import Draw from '../core/utilities/draw.js';
import Settings from './settings.js';

/**
 * Optional presentation diagnostics for Tiles with a Collide mechanic.
 * One listener draws collision envelopes in the Tile's active Layer scope.
 * No Tile or mechanic references are retained between rendering callbacks.
 */
export default class Debug {

	/**
	 * Presentation style for diagnostic envelopes.
	 * @type {Object}
	 */
	static defaults = {
		color: '#ff00ff',
		opacity: 0.2,
	}

	/**
	 * Whether diagnostics contribute pixels. Configure through set().
	 * @type {Boolean}
	 */
	enabled;

	/**
	 * Construct optional diagnostics and register when enabled.
	 * @param {Boolean} enabled Defaults to Settings.debug.
	 * @returns {Debug} this
	 */
	constructor( enabled = Settings.debug ) {
		return this.set( enabled );
	}

	/**
	 * Replace enabled state and update this instance's listener ownership.
	 * @param {Boolean} enabled Defaults to Settings.debug; false removes hooks.
	 * @returns {Debug} this
	 */
	set = ( enabled = Settings.debug ) => {
		this.reset();
		this.enabled = Boolean( enabled );
		this.hooks();

		return this;
	}

	/**
	 * Restore disabled diagnostics and release owned hooks.
	 * @returns {Debug} this
	 */
	reset = () => {
		this.unhooks();
		this.enabled = false;

		return this;
	}

	/**
	 * Register this instance's stable Tile callback when enabled.
	 * Repeated registration is inert under Hooks' callback identity contract.
	 * @returns {void}
	 */
	hooks = () => {
		if ( this.enabled ) {
			Game.Hooks.add( 'Tile.render', this.render );
		}
	}

	/**
	 * Remove only the rendering callback owned by this instance.
	 * @returns {Boolean} Whether a registered callback was removed.
	 */
	unhooks = () => Game.Hooks.remove( 'Tile.render', this.render );

	/**
	 * Draw a Tile's diagnostic envelope into its active presentation scope.
	 * Missing mechanics, disabled diagnostics, and unscoped calls are inert.
	 * The world envelope is translated by the scoped logical-pixel viewpoint;
	 * collision detection and simulation state remain unchanged.
	 *
	 * @param {Tile|null} tile Rendered Tile; defaults to null.
	 * @returns {void}
	 */
	render = ( tile = null ) => {
		if ( ! this.enabled || ! Draw.buffer ) {
			return;
		}
		const bounds = tile?.mechanics?.collide?.bounds();
		if ( ! bounds ) {
			return;
		}
		const viewpoint = Draw.viewpoint ?? { x: 0, y: 0, z: 0 };
		Draw.buffer.rect(
			Debug.defaults.color,
			{
				x: bounds.position.x - viewpoint.x,
				y: bounds.position.y - viewpoint.y,
				z: bounds.position.z - viewpoint.z,
			},
			bounds.size,
			Debug.defaults.opacity,
		);
	}

	/**
	 * Disable diagnostics and release the owned listener; safe to repeat.
	 * @returns {void}
	 */
	destroy = () => {
		this.reset();
	}
}
