import { Scale, Sound } from '../sound/exports.js';

/**
 * The Audio class.
 *
 * This class is a collection of methods used to generate a sound.
 */
export default class Audio {

	/**
	 * Construct the Audio component.
	 */
	constructor() {
		this.set();
	}

	/**
	 * Set the pipeline for the Audio component.
	 *
	 * @param   {Object} pipeline Default AudioContext. The pipeline to send sounds through.
	 * @returns {Audio}  The Audio component.
	 */
	set = (
		pipeline = AudioContext
	) => {

		// Pipeline.
		this.pipeline = new pipeline
			?? new AudioContext;

		// Maybe resume.
		if ( this.canPlay() ) {
			this.pipeline.resume();
		}

		// Scale.
		this.scale = new Scale();

		// Sound.
		this.sound = new Sound();

		// Return.
		return this;
	}

	/**
	 * Reset the Audio component.
	 */
	reset = () => {
		this.set();
	}

	/**
	 * Return the pipeline when getting the Audio component.
	 *
	 * @returns {Object}
	 */
	valueOf = () => {
		return this.pipeline;
	}

	/**
	 * Set the sound.
	 *
	 * @param   {Sound} sound Default new Sound(). The sound to set.
	 * @returns {Audio} The Audio component.
	 */
	setSound = (
		sound = new Sound()
	) => {
		this.sound = sound;

		return this.sound;
	}

	/**
	 * Set the scale.
	 *
	 * @param   {Scale} scale Default new Scale(). The scale to set.
	 * @returns {Audio} The Audio component.
	 */
	setScale = (
		scale = new Scale()
	) => {
		this.scale = scale;

		return this.scale;
	}

	/**
	 * Check if sound can be played.
	 *
	 * @returns {Boolean}
	 */
	canPlay = () => {
		return ( this.pipeline.state === 'running' );
	}

	/**
	 * Play the sound.
	 */
	play = () => {
		this.sound.play( this.pipeline );
	}
}
