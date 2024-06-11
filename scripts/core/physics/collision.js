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
		return (
			( this.tile1.position.x < ( this.tile2.position.x + this.tile2.size.w ) )

			&&

			( this.tile2.position.x < ( this.tile1.position.x + this.tile1.size.w ) )

			&&

			( this.tile1.position.y < ( this.tile2.position.y + this.tile2.size.h ) )

			&&

			( this.tile2.position.y < ( this.tile1.position.y + this.tile1.size.h ) )
		);
	}
}
