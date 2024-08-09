/**
 * The Scale class.
 *
 * This class is a collection of methods used to generate a sound.
 */
export default class Scale {

    /**
     * Construct the Scale.
     *
     * @param {Number} referenceFrequency
     * @param {String} referenceSemitone
     * @param {Number} referenceOctave
     * @param {Number} octaveRatio
     * @param {Array}  semitones
     */
    constructor(
        referenceFrequency = 440,
        referenceSemitone  = 'A',
        referenceOctave    = 4,
        octaveRatio        = 2,
        semitones          = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
    ) {
        this.set(
            referenceFrequency,
            referenceSemitone,
            referenceOctave,
            octaveRatio,
            semitones
        );
    }

    /**
     * Set the Scale properties.
     *
     * @param {Number} referenceFrequency
     * @param {String} referenceSemitone
     * @param {Number} referenceOctave
     * @param {Number} octaveRatio
     * @param {Array}  semitones
     */
    set = (
        referenceFrequency = 440,
        referenceSemitone  = 'A',
        referenceOctave    = 4,
        octaveRatio        = 2,
        semitones          = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
    ) => {
        this.referenceFrequency = referenceFrequency ?? 440;
        this.referenceSemitone  = referenceSemitone  ?? 'A';
        this.referenceOctave    = referenceOctave    ?? '4';
        this.octaveRatio        = octaveRatio        ?? 2;
        this.semitones          = semitones          ?? ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
        this.semitoneRatio      = Math.pow( this.octaveRatio, 1 / semitones.length );
    }

    /**
     * Reset the Scale properties.
     */
    reset = () => {
        this.set(
            440,
            'A',
            4,
            2,
            ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
        );
    }

    /**
     * Get the frequency of a note.
     *
     * @param   {String} note   Default 'A'.
     * @param   {Number} octave Default 4.
     * @returns {Number} The frequency.
     */
    getFrequency = (
        note   = 'A',
        octave = 4
    ) => {
        const
            semitoneDifference = this.getSemitoneDifference( note ),
            octaveShift        = octave - this.referenceOctave,
            octavePower        = Math.pow( this.octaveRatio, octaveShift ),
            semitonePower      = Math.pow( this.semitoneRatio, semitoneDifference ),
            foo                = this.referenceFrequency * octavePower * semitonePower

        return foo;
    }

    /**
     * Get the difference between a note and the reference note.
     *
     * @param {String} note Default 'A'.
     * @returns {Number} The difference.
     */
    getSemitoneDifference = (
        note = 'A'
    ) => {

        // Calculate the difference between the note and the reference.
        const
            referenceIndex = this.semitones.indexOf( this.referenceSemitone ) ?? 0,
            noteIndex      = this.semitones.indexOf( note ) ?? 0,
            diff           = noteIndex - referenceIndex;

        // Throw error if the note is not found.
        if ( noteIndex < 0 ) {
            throw new Error( `Note ${note} not found in the scale.` );
        }

        // Return the difference.
        return diff;
    }

    /**
     * Generate a scale for an octave.
     *
     * @param   {Number} octave Default 4.
     * @returns {Array}  The scale.
     */
    generate = (
        octave = 4
    ) => {
        const scale = this.semitones.map(
            note => ( {
                note,
                frequency: this.getFrequency( note, octave )
            } )
        );

        return scale;
    }
}
