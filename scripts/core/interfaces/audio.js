import { Scale, Sound } from '../sound/exports.js';

/**
 * Browser audio interface.
 */
export default class Audio {

	constructor( pipeline = null ) {
		return this.set( pipeline );
	}

	set = ( pipeline = null ) => {
		const Pipeline = pipeline
			?? globalThis.AudioContext
			?? globalThis.webkitAudioContext
			?? null;

		this.pipeline = typeof Pipeline === 'function'
			? new Pipeline()
			: Pipeline;
		this.scale = new Scale();
		this.sound = new Sound();

		return this;
	}

	reset = () => this.set();

	valueOf = () => this.pipeline;

	setSound = ( sound = new Sound() ) => {
		this.sound = sound;

		return this.sound;
	}

	setScale = ( scale = new Scale() ) => {
		this.scale = scale;

		return this.scale;
	}

	canPlay = () => this.pipeline?.state === 'running';

	play = async () => {
		if ( ! this.pipeline ) {
			return false;
		}

		if ( this.pipeline.state === 'suspended' ) {
			await this.pipeline.resume();
		}

		this.sound.play( this.pipeline );

		return true;
	}
}
