import Settings from '../../../custom/settings.js';
import Game from '../../game.js';
import Time from '../../utilities/time.js';

/**
 * The WallClimb mechanic.
 *
 * Allows a tile (player) to ascend a wall at a controlled speed while:
 * - Actively grabbing a wall (WallGrab is active)
 * - Holding the Up key
 *
 * NOTE: WallClimb requires an active WallGrab as its base state.
 * Climbing is WallGrab + Up input → ascend the wall.
 */
export default class WallClimb {

    /**
     * Default wall climb settings.
     *
     * @type {Object}
     */
    static defaults = {
        speed: 10,
        accel: 0.25,
        max: 10,
    }

    /**
     * Construct.
     *
     * @param {Tile|null} tile
     * @returns {WallClimb} this
     */
    constructor(
        tile = null
    ) {
        return this.set( tile );
    }

    /**
     * Bind (or rebind) the mechanic to a tile.
     *
     * @param {Tile|null} tile
     * @returns {WallClimb} this
     */
    set = (
        tile = null
    ) => {

        // Reset.
        this.reset();

        // Set tile.
        this.tile = tile;

        // Return.
        return this;
    }

    /**
     * Reset internal state.
     *
     * @returns {WallClimb} this
     */
    reset = () => {

        // Clear properties.
        this.tile = null;

        // Load settings (fallback to defaults if custom tree not present).
        this.settings  = Settings.player?.wall?.climb ?? WallClimb.defaults;
        this.listening = true;

        // Return.
        return this;
    }

    /**
     * Primary loop hook.
     */
    listen = () => {

        // Skip if disabled or unbound.
        if ( ! this.listening || ! this.tile ) {
            return;
        }

        // Attempt to climb if eligible.
        if ( this.can() ) {
            this.do();
        }
    }

    /**
     * Are we currently climbing?
     *
     * @returns {boolean} True if climbing.
     */
    doing = () => {
        return this.can();
    }

    /**
     * Eligibility check.
     *
     * Conditions:
     * - Must have an active WallGrab (base requirement).
     * - Holding Up.
     *
     * The wall contact and directional input checks are handled by WallGrab.
     *
     * @returns {boolean} True if eligible to climb.
     */
    can = () => {
        if ( ! this.tile ) return false;

        // First check: Must be actively grabbing a wall.
        const grab = this.tile.mechanics?.wall?.grab;
        if ( ! grab || ! grab.doing() ) return false;

        // Second check: Must be holding Up to climb.
        const holdUp = Game.History.hold( 'up' );
        if ( ! holdUp?.down ) return false;

        return true;
    }

    /**
     * Apply upward climb velocity, with mild acceleration toward target.
     *
     * @returns {void}
     */
    do = () => {

        // Velocity ref.
        const velocity = this.tile?.physics?.velocity;
        if ( ! velocity ) {
            return;
        }

        // Upward (negative Y)
        const target = -Math.abs( this.settings.speed );

        // Optional smoothing; accel <= 0 => instant set.
        if ( this.settings.accel <= 0 ) {
            velocity.y = target;
        } else {
            const diff = target - velocity.y;
            velocity.y += diff * this.settings.accel * Time.scale;
        }

        // Clamp (ensure we don't exceed max upward magnitude negatively).
        if ( velocity.y < -Math.abs( this.settings.max ) ) {
            velocity.y = -Math.abs( this.settings.max );
        }
    }
}
