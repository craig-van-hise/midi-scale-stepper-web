import { useMidiStore } from '../store/useMidiStore';
import { getLUT } from './lutRegistry';

export function applyOutputFilter(midiNote: number, mode: string, minRange: number, maxRange: number): number | null {
  let finalNote = midiNote;

  if (finalNote >= minRange && finalNote <= maxRange) {
    return finalNote;
  }

  if (mode === 'octave_wrap') {
    while (finalNote < minRange) finalNote += 12;
    while (finalNote > maxRange) finalNote -= 12;
    
    if (finalNote < minRange || finalNote > maxRange) return null; // shouldDrop
    return finalNote;
  }

  if (mode === 'smart_wrap') {
    const pc = ((finalNote % 12) + 12) % 12;

    if (finalNote > maxRange) {
      let wrapped = minRange - (minRange % 12) + pc;
      if (wrapped < minRange) wrapped += 12;
      if (wrapped <= maxRange) return wrapped;
      return null; // shouldDrop
    } else if (finalNote < minRange) {
      let wrapped = maxRange - (maxRange % 12) + pc;
      if (wrapped > maxRange) wrapped -= 12;
      if (wrapped >= minRange) return wrapped;
      return null; // shouldDrop
    }
  }

  return null;
}

export function executeScaleStep(stepOffset: number) {
  const { lastPlayedMidi, rootNote, scaleDecimalId } = useMidiStore.getState().activeState;
  const { filterMode, filterRange } = useMidiStore.getState().globalSettings;
  const lut = getLUT();
  const entry = scaleDecimalId !== null ? lut[scaleDecimalId] : null;

  if (!entry) return;

  const pitch_classes = entry.pitch_class_set;
  const root = rootNote ?? 0;

  // 2. Define Anchor
  const currentMidi = lastPlayedMidi ?? (60 + root);

  // 3. Find Current Index
  let currentInterval = (currentMidi - root) % 12;
  if (currentInterval < 0) currentInterval += 12;

  let currentIndex = pitch_classes.indexOf(currentInterval);
  if (currentIndex === -1) currentIndex = 0;

  // 4. Calculate New Index & Octave Shift
  const newIndex = currentIndex + stepOffset;
  const L = pitch_classes.length;
  const octaveShift = Math.floor(newIndex / L);
  const wrappedIndex = ((newIndex % L) + L) % L;

  // 5. Reconstruct MIDI Note
  const targetInterval = pitch_classes[wrappedIndex];
  const currentOctaveBase = currentMidi - currentInterval;
  let outputMidi = currentOctaveBase + (octaveShift * 12) + targetInterval;

  // Clamp to valid MIDI range
  outputMidi = Math.max(0, Math.min(127, outputMidi));

  // Apply Output Filter
  const finalMidi = applyOutputFilter(outputMidi, filterMode, filterRange[0], filterRange[1]);

  // 6. State Push
  if (lastPlayedMidi !== null) {
    useMidiStore.getState().removeOutputKey(lastPlayedMidi);
  }

  if (finalMidi !== null) {
    useMidiStore.getState().setLastPlayedMidi(finalMidi);
    useMidiStore.getState().addOutputKey(finalMidi);
  }
}
