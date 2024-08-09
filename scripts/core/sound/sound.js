/**
 * The Sound class.
 *
 * This class is a collection of methods used to generate a sound.
 */
export default class Sound {

	constructor(
        frequency = 440,
        amplitude = 0.5,
        waveform  = 'sine',
        timbre    = [],
        envelope  = '',
        duration  = 500,
        phase     = 0,
        harmonics = 0,
        spatial   = []
    ) {
		this.set(
            frequency,
            amplitude,
            waveform,
            timbre,
            envelope,
            duration,
            phase,
            harmonics,
            spatial
        );
	}

	set = (
        frequency = 440,
        amplitude = 0.5,
        waveform  = 'sine',
        timbre    = [],
        envelope  = '',
        duration  = 500,
        phase     = 0,
        harmonics = 0,
        spatial   = []
    ) => {
        this.frequency = frequency;
        this.amplitude = amplitude;
        this.waveform  = waveform;
        this.timbre    = timbre;
        this.envelope  = envelope;
        this.duration  = duration;
        this.phase     = phase;
        this.harmonics = harmonics;
        this.spatial   = spatial;

        return this;
	}

	reset = () => {
        this.set( 440, 0.5, 'sine', '', '', 500, 0, 0, [] );
	}

    /**
     * Play the sound.
     *
     * @param {Object} pipeline Default {}. The pipeline to send sounds through.
     */
    play = (
        pipeline = {},
    ) => {
        const
            osci = pipeline.createOscillator(),
            gain = pipeline.createGain();

        // Connect the oscillator to the gain.
        osci.connect( gain );

        // Connect the gain to the Audio destination (browser, probably).
        gain.connect( pipeline.destination );

        // Set the properties.
        gain.gain.value      = this.amplitude;
        osci.frequency.value = this.frequency;
        osci.type            = this.waveform;

        // Start the oscillator.
        osci.start();

        // Stop the oscillator after the duration.
        setTimeout(
            () => {
                osci.stop();
            },
            this.duration
        );
    }
}
