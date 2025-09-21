export default class Easing {

	constructor() {
		return this.set();
	}

	set = () => {
		return this;
	}

	outCubic = ( t ) => {
		return 1 - Math.pow( 1 - t, 3 );
	}

	inExpo = ( t ) => {
		return t === 0
			? 0
			: Math.pow( 2, 10 * t - 10 );
	}

	inOutExpo = ( t ) => {
		return t === 0
				? 0
				: t === 1
					? 1
					: t < 0.5
						? Math.pow( 2, 20 * t - 10 ) / 2
						: ( 2 - Math.pow( 2, -20 * t + 10 ) ) / 2;
	}

	outCirc = ( t ) => {
		return Math.sqrt( 1 - Math.pow( t - 1, 2 ) );
	}

	outBack = ( t ) => {
		let c1 = 1.70158,
			c3 = c1 + 1;

		return 1 + c3 * Math.pow( t - 1, 3 ) + c1 * Math.pow( t - 1, 2 );
	}

	outElastic = ( t ) => {
		let c4 = ( 2 * Math.PI ) / 3;

		return t === 0
				? 0
				: t === 1
				? 1
				: Math.pow( 2, -10 * t ) * Math.sin( ( t * 10 - 0.75 ) * c4 ) + 1;
	}

	outBounce = ( t ) => {
		let n1 = 7.5625,
			d1 = 2.75;

		if ( t < 1 / d1 ) {
			return n1 * t * t;

		} else if ( t < 2 / d1 ) {
			return n1 * ( t -= 1.5 / d1 ) * t + 0.75;

		} else if ( t < 2.5 / d1 ) {
			return n1 * ( t -= 2.25 / d1 ) * t + 0.9375;

		} else {
			return n1 * ( t -= 2.625 / d1 ) * t + 0.984375;
		}
	}
}
