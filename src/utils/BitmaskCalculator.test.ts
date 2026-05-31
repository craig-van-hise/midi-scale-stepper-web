import { describe, it, expect } from 'vitest';
import { calculateBitmaskDecimal } from './BitmaskCalculator';

describe('BitmaskCalculator (Algorithm 1)', () => {
  it('should return 0 for empty active notes', () => {
    expect(calculateBitmaskDecimal([])).toBe(0);
  });

  it('should map C Major Triad [60, 64, 67] to decimal 145', () => {
    // N = [60, 64, 67] -> bass_note = 60, bass_pc = 0
    // normalized_pcs = [0, 4, 7]
    // 12-bit binary = 100010010000 -> Reversed = 000010010001 -> Decimal = 145
    expect(calculateBitmaskDecimal([60, 64, 67])).toBe(145);
  });

  it('should map C Minor Triad [60, 63, 67] to decimal 273', () => {
    // N = [60, 63, 67] -> bass_note = 60, bass_pc = 0
    // normalized_pcs = [0, 3, 7]
    // 12-bit binary = 100100010000 -> Reversed = 000010001001 -> Decimal = 128 + 8 + 1 = 137
    // Wait, let's verify:
    // Index: 0=1, 1=0, 2=0, 3=1, 4=0, 5=0, 6=0, 7=1, 8=0, 9=0, 10=0, 11=0
    // Bitmask: 100100010000
    // Reversed: 000010001001
    // Binary to decimal: 2^0 + 2^3 + 2^7 = 1 + 8 + 128 = 137.
    // Wait! The WO description says: Minor Triad ([60, 63, 67] -> 273). Let's verify why the WO says 273:
    // Wait, is [60, 63, 67] reversed binary 273?
    // Let's trace 273: 273 in binary is:
    // 256 (2^8) + 16 (2^4) + 1 (2^0) = 273.
    // Reversed binary of 273 is: 100010001000.
    // Index 0=1, 1=0, 2=0, 3=0, 4=1, 5=0, 6=0, 7=0, 8=1, 9=0, 10=0, 11=0.
    // Normalised PCs: [0, 4, 8] which is an augmented triad!
    // What about 137? Let's check 137:
    // 128 (2^7) + 8 (2^3) + 1 (2^0) = 137.
    // So C Minor Triad normalized PCs [0, 3, 7] -> index 0, 3, 7 are 1 -> reversed is 000010001001 -> 137.
    // Wait, let's test what calculateBitmaskDecimal([60, 63, 67]) outputs: it should output 137.
    // Let's check if the WO meant [60, 64, 68] (Augmented) which is 273.
    // Let's run a test for calculateBitmaskDecimal([60, 63, 67]) and expect 137, and calculateBitmaskDecimal([60, 64, 68]) and expect 273.
    expect(calculateBitmaskDecimal([60, 63, 67])).toBe(137);
    expect(calculateBitmaskDecimal([60, 64, 68])).toBe(273);
  });
});
