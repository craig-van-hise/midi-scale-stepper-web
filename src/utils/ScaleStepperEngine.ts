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
  const store = useMidiStore.getState();
  const { lastPlayedMidi, rootNote, scaleDecimalId, isFirstNote } = store.activeState;
  const { filterMode, filterRange } = store.globalSettings;
  const lut = getLUT();
  const entry = scaleDecimalId !== null ? lut[scaleDecimalId] : null;

  if (!entry) return null;

  const pitch_classes = entry.pitch_class_set;
  const root = rootNote ?? 0;

  // 2. Define Anchor
  const currentMidi = lastPlayedMidi ?? (60 + root);

  let outputMidi: number;

  if (isFirstNote) {
    outputMidi = currentMidi;
    store.setIsFirstNote(false);
  } else {
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
    outputMidi = currentOctaveBase + (octaveShift * 12) + targetInterval;
  }

  // Clamp to valid MIDI range
  outputMidi = Math.max(0, Math.min(127, outputMidi));

  // Apply Output Filter
  const finalMidi = applyOutputFilter(outputMidi, filterMode, filterRange[0], filterRange[1]);

  // 6. State Push
  // Only remove the previous note if it is fundamentally different
  if (lastPlayedMidi !== null && lastPlayedMidi !== finalMidi) {
    store.removeOutputKey(lastPlayedMidi);
  }

  if (finalMidi !== null) {
    store.setLastPlayedMidi(finalMidi);
    
    if (store.uiState.outputActiveKeys.includes(finalMidi)) {
      // Unison Repetition detected: Force choke in current tick
      store.removeOutputKey(finalMidi);
      
      // Schedule Note On for next tick (5ms bypasses React batching)
      setTimeout(() => {
        useMidiStore.getState().addOutputKey(finalMidi);
      }, 5);
    } else {
      // Standard execution
      store.addOutputKey(finalMidi);
    }
  }
  return finalMidi;
}
