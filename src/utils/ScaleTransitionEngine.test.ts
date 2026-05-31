import { describe, it, expect } from 'vitest';
import { handleScaleTransition } from './ScaleTransitionEngine';

describe('ScaleTransitionEngine (Algorithm 3)', () => {
  const cMajor = [0, 2, 4, 5, 7, 9, 11];
  const cPentatonic = [0, 2, 4, 7, 9];

  it('should return null if lastPlayedMidi is null', () => {
    expect(handleScaleTransition(null, cMajor, 'UP')).toBeNull();
  });

  it('should retain pitch if lastPlayedMidi is already in the new scale', () => {
    // C4 (60) is in both C Major and C Pentatonic
    expect(handleScaleTransition(60, cPentatonic, 'UP')).toBe(60);
  });

  it('should snap to nearest note if lastPlayedMidi is not in the new scale', () => {
    // F4 (65) is in C Major but NOT in C Pentatonic [0, 2, 4, 7, 9]
    // Round UP: F4 (65, pc 5) -> G4 (67, pc 7)
    // Round DOWN: F4 (65, pc 5) -> E4 (64, pc 4)
    expect(handleScaleTransition(65, cPentatonic, 'UP')).toBe(67);
    expect(handleScaleTransition(65, cPentatonic, 'DOWN')).toBe(64);
  });
});
