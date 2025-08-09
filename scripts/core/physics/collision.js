/**
 * The Collision object.
 *
 * This object is responsible for determining if a Tile object is
 * occupying the space of another Tile object along the
 * horizontal or vertical plains.
 */
export default class Collision {

	/**
	 * Construct the object.
	 *
	 * @param {Tile} tile1
	 * @param {Tile} tile2
	 */
	constructor(
		tile1 = {},
		tile2 = {}
	) {
		this.set( tile1, tile2 );
	}

	/**
	 * Set the object.
	 *
	 * @param {Tile} tile1
	 * @param {Tile} tile2
	 */
	set = (
		tile1 = {},
		tile2 = {}
	) => {
		this.tile1 = tile1;
		this.tile2 = tile2;
	}

	/**
	 * Detect if two Tiles have collided.
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
