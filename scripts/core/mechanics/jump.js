import Game from '../game.js';

/**
 * The Jump mechanic.
 *
 * Handles jump triggering (input -> upward impulse) and hook filtering.
 * Gravity logic is managed by the Fall mechanic.
 */
export default class Jump {

	/**
	 * Construct the Jump mechanic.
	 *
	 * @param {Tile} tile A Tile with `velocity`, `contact`, `jumps`, etc.
	 */
	constructor(
		tile = null
	) {
		this.set( tile );
	}

	/**
	 * Set the mechanic.
	 *
	 * @param {Tile} tile A Tile with `velocity`, `contact`, `jumps`, etc.
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
	 * Process jump input (assumes Fall mechanic has already applied gravity).
	 */
	listen = () => {

        // Bail if no tile.
		if ( ! this.tile ) {
			return;
		}

		// Check jump conditions.
		const contact  = this.tile.physics?.contact;
		const velocity = this.tile.physics?.velocity;

		if ( this.canJump() && Game.Inputs.pressed( 'jump' ) ) {

			// Increment jump count if not wall jumping.
			if ( ! this.canWallJump() ) {
				this.tile.jumps.current++;
			}

			// Apply jump impulse.
			velocity.y = -this.tile.jumps.power;
		}
	}

	/**
     * Determine if tile can jump.
     */
	canJump = () => {
		const contact = this.tile.physics?.contact;

		return (
			! this.falling()
			&&
			this.tile.jumps.max
			&&
			(
				contact.bottom
				||
				( this.tile.jumps.current < this.tile.jumps.max )
				||
				(
					this.tile.jumps.wall
					&&
					this.canWallJump()
				)
			)
		);
	}

	/**
     * Determine if tile can wall jump.
     */
	canWallJump = () => {
		const contact = this.tile.physics?.contact;

		return (
			this.tile.jumps.wall
			&&
			this.tile.jumps.max
			&&
			! contact.bottom
			&&
			this.touchingWall()
		);
	}

	/**
     * Determine if tile is falling (no jumps yet & not on ground).
     */
	falling = () => {
		const contact = this.tile.physics?.contact;

		return (
			! this.tile.jumps.current
			&&
			! contact.bottom
		);
	}

	/**
     * Determine if tile touches a wall.
     */
	touchingWall = () => {
		const contact = this.tile.physics?.contact;

		return (
			contact.left
			||
			contact.right
		);
	}
}
