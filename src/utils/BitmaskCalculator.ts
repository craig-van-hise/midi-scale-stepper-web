/**
 * Algorithm 1: MIDI Selection & Bitmask Parsing
 * Converts an array of active MIDI notes into a scale decimal ID for PCS_LUT lookups.
 */
export function calculateBitmaskDecimal(midiNotes: number[]): number {
  if (midiNotes.length === 0) return 0;

  // 1. Extract Pitches
  // 2. Determine Bass note and its pitch class
  const bassNote = Math.min(...midiNotes);
  const bassPc = ((bassNote % 12) + 12) % 12;

  // 3. Normalize to Bass pitch class
  const normalizedPcs = midiNotes.map((n) => {
    const pc = ((n % 12) + 12) % 12;
    return (pc - bassPc + 12) % 12;
  });

  const uniquePcs = new Set(normalizedPcs);

  // 4. Bitmask Generation (Index 0 is the left-most bit)
  let bitmask = '';
  for (let i = 0; i < 12; i++) {
    bitmask += uniquePcs.has(i) ? '1' : '0';
  }

  // 5. Reflection & Decimal Conversion
  const reversedBitmask = bitmask.split('').reverse().join('');
  return parseInt(reversedBitmask, 2);
}
