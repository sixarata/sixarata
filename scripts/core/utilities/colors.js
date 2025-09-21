/**
 * The Colors class.
 *
 * This class is a collection of methods used to return colors that are
 * computed or random in some way.
 */
export default class Colors {

	constructor() {
		return this.set();
	}

	set = () => {
		this.reset();

		// Return.
		return this;
	}

	reset = () => {

	}

	random = () => {
		let r = 0,
			g = 0,
			b = 0;

		while ( r < 100 && g < 100 && b < 100 ) {
			r = Math.floor( Math.random() * 256 );
			g = Math.floor( Math.random() * 256 );
			b = Math.floor( Math.random() * 256 );
		}

		return "rgb(" + r + "," + g + ","  + b + ")";
	}

	cloud = () => {
		let letters = '369',
			base    = '3',
			seed    = Math.random() * letters.length,
			hex     = letters[ Math.floor( seed ) ],
			color   = '#' +
					base + hex +
					base + hex +
					base + hex;

		return color;
	}
}
