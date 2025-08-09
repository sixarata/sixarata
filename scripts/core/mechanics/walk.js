import Game from '../game.js';
import Settings from '../../custom/settings.js';

/**
 * The Walk mechanic.
 *
 * This mechanic encapsulates horizontal movement (left/right, friction, clamps)
 * for a tile that has a Velocity and responds to Inputs.
 */
export default class Walk {

    /**
     * Construct the Walk mechanic.
     *
     * @param {Tile} tile A Tile with a `velocity` property.
     */
    constructor(
        tile = null
    ) {
        this.set( tile );
    }

    /**
     * Set the mechanic.
     *
     * @param {Tile} tile A Tile with a `velocity` property.
     */
    set = (
        tile = null
    ) => {
        this.reset();
        this.tile = tile;
    }

    /**
     * Reset the mechanic.
     */
    reset = () => {
        this.tile = null;
    }

    /**
     * Respond to Left and Right input and adjust horizontal velocity.
     */
    listen = () => {

        // Bail if there's no tile.
        if ( ! this.tile ) {
            return;
        }

        // Use unified physics object.
        const v = this.tile.physics?.velocity;

        // Left + Right.
        if (
            Game.Inputs.pressed( 'right' )
            &&
            Game.Inputs.pressed( 'left' )
        ) {
            v.x = 0;

        // Move left.
        } else if ( Game.Inputs.pressed( 'left' ) ) {
            v.x = -Settings.player.speed;

        // Move right.
        } else if ( Game.Inputs.pressed( 'right' ) ) {
            v.x = Settings.player.speed;

        // Slow down.
        } else if (
            ! Game.Inputs.pressed( 'right' )
            &&
            ! Game.Inputs.pressed( 'left' )
        ) {
            v.x *= ( Game.Friction.force );
        }

        // Prevent infinitely small X.
        if ( Math.abs( v.x ) < Game.Friction.force ) {
            v.x = 0;
        }
    }
}
