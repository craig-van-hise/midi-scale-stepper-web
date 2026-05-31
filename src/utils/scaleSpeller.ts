import { PCS_Entry } from '../types/midi';

const DIATONIC_STEPS = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
const NATURAL_SEMITONE_OFFSETS = [0, 2, 4, 5, 7, 9, 11]; // Semitone offsets from C

/**
 * getScaleRootName
 * Determines the optimal root note name for a given MIDI note and LUT entry.
 */
export function getScaleRootName(midiNote: number, entry: PCS_Entry | null): string {
    const root_pc = midiNote % 12;
    const whiteKeys: Record<number, string> = {
        0: 'C', 2: 'D', 4: 'E', 5: 'F', 7: 'G', 9: 'A', 11: 'B'
    };

    if (whiteKeys[root_pc] !== undefined) {
        return whiteKeys[root_pc];
    }

    // Black Key Lookup
    if (entry?.scale_bk_root_spellings) {
        const spelling = entry.scale_bk_root_spellings[root_pc.toString()];
        if (spelling) return spelling;
    }

    // Fallback to flats
    const flatFallbacks: Record<number, string> = {
        1: 'Db', 3: 'Eb', 6: 'Gb', 8: 'Ab', 10: 'Bb'
    };

    return flatFallbacks[root_pc] || 'C';
}

export interface SpellingResult {
    stepOffset: number;
    accidental: string;
    noteName: string;
}

/**
 * spellByInterval
 * Calculates the exact diatonic spelling and staff position for a pitch
 * based on its functional interval from a root.
 */
export function spellByInterval(
    targetPitch: number,
    rootPitch: number,
    rootName: string,
    intervalString: string
): SpellingResult {
    // 1. Extract Root Base Data
    const rootBaseChar = rootName.charAt(0).toUpperCase();
    const rootDiatonicIdx = DIATONIC_STEPS.indexOf(rootBaseChar);
    if (rootDiatonicIdx === -1) {
        throw new Error(`Invalid root name: ${rootName}`);
    }

    // Estimate root octave (assuming root is naturally spelled or simple accidental)
    // MIDI 60 is C4. 
    const rootOctave = Math.floor(rootPitch / 12) - 1;

    // 2. Parse the Interval
    // Match the numeric part (e.g., 'b5' -> 5, '#11' -> 11)
    const intMatch = intervalString.match(/\d+/);
    const intVal = intMatch ? parseInt(intMatch[0], 10) : 1;
    const diatonicOffset = intVal - 1;

    // 3. Calculate Target Diatonic Position
    const targetDiatonicIdx = (rootDiatonicIdx + diatonicOffset) % 7;
    const targetLetter = DIATONIC_STEPS[targetDiatonicIdx];
    const octaveCrossings = Math.floor((rootDiatonicIdx + diatonicOffset) / 7);
    const targetOctave = rootOctave + octaveCrossings;

    // 4. Calculate Absolute Offsets
    // Middle C (C4) has a stepOffset of 0 in this coordinate system.
    // Each octave adds 7 diatonic steps.
    const stepOffset = (targetOctave - 4) * 7 + targetDiatonicIdx;
    
    // Calculate the MIDI pitch of the "natural" version of this letter/octave
    const targetNaturalMidi = (targetOctave + 1) * 12 + NATURAL_SEMITONE_OFFSETS[targetDiatonicIdx];

    // 5. Derive Accidental
    const diff = targetPitch - targetNaturalMidi;
    let accidentalSymbol = ''; // Maps to SMuFL
    let accidentalText = '';   // Maps to text label

    // SMuFL Accidentals
    // \uE264: double flat
    // \uE260: flat
    // \uE261: natural (usually empty in this context unless forced)
    // \uE262: sharp
    // \uE263: double sharp
    
    if (diff === -2) {
        accidentalSymbol = '\uE264';
        accidentalText = 'bb';
    } else if (diff === -1) {
        accidentalSymbol = '\uE260';
        accidentalText = 'b';
    } else if (diff === 1) {
        accidentalSymbol = '\uE262';
        accidentalText = '#';
    } else if (diff === 2) {
        accidentalSymbol = '\uE263';
        accidentalText = 'x';
    }

    return {
        stepOffset,
        accidental: accidentalSymbol,
        noteName: `${targetLetter}${accidentalText}`
    };
}
