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
