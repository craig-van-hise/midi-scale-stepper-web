import { useMidiStore } from '../store/useMidiStore';
import { getLUT } from './lutRegistry';

/**
 * Algorithm 2: Out-of-Scale Handling (Rounding Algorithm)
 * When a calculated step target lands on a pitch class not present in the scale,
 * it rounds up or down according to the preference, adjusting the octave if boundaries are crossed.
 */
export function roundToScale(
  note: number,
  scalePitchClasses: number[],
  preference: 'UP' | 'DOWN'
): number {
  if (scalePitchClasses.length === 0) return note;

  // Normalize pitch classes just in case they are not 0-11
  const validPcs = scalePitchClasses.map((pc) => ((pc % 12) + 12) % 12);
  
  let pitchClass = ((note % 12) + 12) % 12;
  let octave = Math.floor(note / 12) - 1; // standard MIDI octave definition (C4 = 60, octave = 4)

  if (validPcs.includes(pitchClass)) {
    return note;
  }

  if (preference === 'UP') {
    let currentPc = pitchClass;
    let currentOctave = octave;
    while (!validPcs.includes(currentPc)) {
      currentPc += 1;
      if (currentPc > 11) {
        currentPc = 0;
        currentOctave += 1;
      }
    }
    return (currentOctave + 1) * 12 + currentPc;
  } else {
    // preference === 'DOWN'
    let currentPc = pitchClass;
    let currentOctave = octave;
    while (!validPcs.includes(currentPc)) {
      currentPc -= 1;
      if (currentPc < 0) {
        currentPc = 11;
        currentOctave -= 1;
      }
    }
    return (currentOctave + 1) * 12 + currentPc;
  }
}

export function roundNote(
  rawNote: number,
  scaleDecimalId: number | null,
  preference: 'UP' | 'DOWN'
): number {
  const lut = getLUT();
  const entry = scaleDecimalId !== null && lut ? lut[scaleDecimalId] : null;
  const pitch_classes = entry ? entry.pitch_class_set : [0, 2, 4, 5, 7, 9, 11];
  const root = useMidiStore.getState().activeState.rootNote ?? 0;
  const absolutePitchClasses = pitch_classes.map(pc => (root + pc) % 12);
  return roundToScale(rawNote, absolutePitchClasses, preference);
}

export function isNoteInScale(note: number, scaleDecimalId: number | null): boolean {
  const lut = getLUT();
  const entry = scaleDecimalId !== null && lut ? lut[scaleDecimalId] : null;
  const pitch_classes = entry ? entry.pitch_class_set : [0, 2, 4, 5, 7, 9, 11];
  const root = useMidiStore.getState().activeState.rootNote ?? 0;
  const absolutePitchClasses = pitch_classes.map(pc => (root + pc) % 12);
  const pc = ((note % 12) + 12) % 12;
  return absolutePitchClasses.includes(pc);
}

export function calculateDynamicStepOffset(
  rawMidi: number, 
  scaleDecimalId: number | null, 
  roundingMode: 'UP' | 'DOWN'
): number {
  if (rawMidi === 60) return 0;

  const roundedTarget = roundNote(rawMidi, scaleDecimalId, roundingMode);
  if (roundedTarget === 60) return 0;

  let steps = 0;
  if (roundedTarget > 60) {
    for (let i = 61; i <= roundedTarget; i++) {
      if (isNoteInScale(i, scaleDecimalId)) steps++;
    }
    return steps;
  } else {
    for (let i = 59; i >= roundedTarget; i--) {
      if (isNoteInScale(i, scaleDecimalId)) steps++;
    }
    return -steps;
  }
}

