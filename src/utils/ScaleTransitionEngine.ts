import { roundToScale } from './RoundingEngine';

/**
 * Algorithm 3: Scale Transition & Voice-Leading Fallback
 * Manages transition of currently held/played notes when the active scale boundaries change.
 */
export function handleScaleTransition(
  lastPlayedMidi: number | null,
  newScalePitchClasses: number[],
  preference: 'UP' | 'DOWN'
): number | null {
  if (lastPlayedMidi === null) return null;
  if (newScalePitchClasses.length === 0) return lastPlayedMidi;

  const lastPc = ((lastPlayedMidi % 12) + 12) % 12;
  const validPcs = newScalePitchClasses.map((pc) => ((pc % 12) + 12) % 12);

  if (validPcs.includes(lastPc)) {
    return lastPlayedMidi;
  }

  // If not in scale, snap to the nearest valid note using Algorithm 2 (roundToScale)
  return roundToScale(lastPlayedMidi, validPcs, preference);
}
