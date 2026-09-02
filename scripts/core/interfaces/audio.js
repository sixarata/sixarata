import { Scale, Sound } from '../sound/exports.js';

/**
 * The Audio interface.
 *
 * Owns the browser audio pipeline and the currently selected musical scale and
 * sound. Browsers commonly create an AudioContext in a suspended state until a
 * user gesture occurs, so play() resumes that context before producing sound.
 */
export default class Audio {

	/**
	 * Construct the Audio interface.
	 *
	 * @param {Function|Object|null} pipeline AudioContext constructor or instance.
	 * @returns {Audio} this
	 */
	constructor( pipeline = null ) {
		return this.set( pipeline );
	}

	/**
	 * Configure the audio pipeline and reset the selected scale and sound.
	 *
	 * Passing a constructor creates an instance. Passing an existing pipeline
	 * preserves that instance, which makes the interface testable without browser
	 * audio support.
	 *
	 * @param {Function|Object|null} pipeline AudioContext constructor or instance.
	 * @returns {Audio} this
	 */
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

	/**
	 * Reset to the environment's default pipeline, scale, and sound.
	 *
	 * @returns {Audio} this
	 */
	reset = () => this.set();

	/**
	 * Return the underlying pipeline during numeric or primitive coercion.
	 *
	 * @returns {Object|null} The active audio pipeline.
	 */
	valueOf = () => this.pipeline;

	/**
	 * Select the sound that play() will produce.
	 *
	 * @param {Sound} sound Sound definition to select.
	 * @returns {Sound} The selected sound.
	 */
	setSound = ( sound = new Sound() ) => {
		this.sound = sound;

		return this.sound;
	}

	/**
	 * Select the musical scale used to derive note frequencies.
	 *
	 * @param {Scale} scale Scale definition to select.
	 * @returns {Scale} The selected scale.
	 */
	setScale = ( scale = new Scale() ) => {
		this.scale = scale;

		return this.scale;
	}

	/**
	 * Determine whether the browser pipeline can currently emit audio.
	 *
	 * @returns {Boolean} True when the pipeline exists and is running.
	 */
	canPlay = () => this.pipeline?.state === 'running';

	/**
	 * Resume the browser pipeline if necessary, then play the selected sound.
	 *
	 * @returns {Promise<Boolean>} Whether playback was handed to a pipeline.
	 */
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
