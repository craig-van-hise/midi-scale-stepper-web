import { describe, it, expect } from 'vitest';
import { roundToScale } from './RoundingEngine';

describe('RoundingEngine (Algorithm 2)', () => {
  const cMajorPentatonic = [0, 2, 4, 7, 9]; // C, D, E, G, A

  it('should return note unchanged if it is in the scale', () => {
    // 60 is C4 (pitch class 0), which is in C Major Pentatonic
    expect(roundToScale(60, cMajorPentatonic, 'UP')).toBe(60);
    expect(roundToScale(60, cMajorPentatonic, 'DOWN')).toBe(60);
  });

  it('should round UP of D#4 (63) in C Pentatonic to E4 (64)', () => {
    // D#4 (63) -> pc 3 is not in [0, 2, 4, 7, 9].
    // Rounding UP: 3 + 1 = 4 (E, which is in scale). Output: 64 (E4).
    expect(roundToScale(63, cMajorPentatonic, 'UP')).toBe(64);
  });

  it('should round UP of B4 (71) to C5 (72) (octave wrap up)', () => {
    // B4 (71) -> pc 11 is not in C Pentatonic [0, 2, 4, 7, 9].
    // Rounding UP: 11 + 1 = 12 -> 0 (C, which is in scale), increment octave -> C5 (72).
    expect(roundToScale(71, cMajorPentatonic, 'UP')).toBe(72);
  });

  it('should round DOWN of C#4 (61) to C4 (60)', () => {
    // C#4 (61) -> pc 1 is not in C Pentatonic.
    // Rounding DOWN: 1 - 1 = 0 (C, in scale) -> C4 (60).
    expect(roundToScale(61, cMajorPentatonic, 'DOWN')).toBe(60);
  });

  it('should round DOWN of C4 (60) to B3 (59) if C is not in scale (octave wrap down)', () => {
    // Scale without C: [2, 4, 7, 9, 11] (D, E, G, A, B)
    // Note C4 (60) -> pc 0.
    // Rounding DOWN: 0 - 1 = -1 -> 11 (B, in scale), decrement octave -> B3 (59).
    const scaleWithoutC = [2, 4, 7, 9, 11];
    expect(roundToScale(60, scaleWithoutC, 'DOWN')).toBe(59);
  });
});
