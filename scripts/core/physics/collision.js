/**
 * The Collision object.
 *
 * Detects whether the axis-aligned bounds of two Tiles overlap on the current
 * two-dimensional X and Y plane. It intentionally answers only whether an
 * overlap exists; Contact identifies the affected side and resolves it.
 *
 * Tile positions and sizes retain Z and depth values so this detector can be
 * extended when rooms gain layers or depth-aware collision behavior.
 */
export default class Collision {

	/**
	 * Construct the object.
	 *
	 * @param {Tile} tile1
	 * @param {Tile} tile2
	 * @returns {Collision}
	 */
	constructor(
		tile1 = {},
		tile2 = {}
	) {
		return this.set( tile1, tile2 );
	}

	/**
	 * Set the object.
	 *
	 * @param {Tile} tile1
	 * @param {Tile} tile2
	 * @returns {Collision}
	 */
	set = (
		tile1 = {},
		tile2 = {}
	) => {
		this.tile1 = tile1;
		this.tile2 = tile2;

		// Return.
		return this;
	}

	/**
	 * Reset the object.
	 *
	 * @returns {Collision}
	 */
	reset = () => {
		return this.set( {}, {} );
	}

	/**
	 * Detect if two Tiles overlap on the X and Y axes.
	 *
	 * @returns {Boolean}
	 */
	detect = () => {
		const a = this.tile1.physics;
		const b = this.tile2.physics;

		return (
			( a.position.x < ( b.position.x + b.size.w ) )
			&&
			( b.position.x < ( a.position.x + a.size.w ) )
			&&
			( a.position.y < ( b.position.y + b.size.h ) )
			&&
			( b.position.y < ( a.position.y + a.size.h ) )
		);
	}
}
