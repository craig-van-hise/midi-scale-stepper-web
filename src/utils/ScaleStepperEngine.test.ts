import { describe, it, expect, beforeEach } from 'vitest';
import { useMidiStore } from '../store/useMidiStore';
import { executeScaleStep, applyOutputFilter } from './ScaleStepperEngine';
import { STEPPER_DATA_MAP } from '../components/ScaleStepperKeySwitches25';
import { getLUT } from './lutRegistry';

describe('ScaleStepperEngine & Phase 1/2 Verification', () => {
  beforeEach(() => {
    useMidiStore.getState().panic();
    // Default mock setup
  });

  it('Phase 1 Checkpoint: should correctly map incoming note 75 (Eb5) to map index 15, index "+2" and stepOffset 2', () => {
    const note = 75;
    const mapIndex = note - 60;
    const mappedData = STEPPER_DATA_MAP[mapIndex];

    expect(mapIndex).toBe(15);
    expect(mappedData.index).toBe('+2');
    
    const stepOffset = parseInt(mappedData.index, 10);
    expect(stepOffset).toBe(2);
  });

  it('Phase 2 Checkpoint: should correctly calculate stepping transposition and wrap around scale degrees and octaves', () => {
    // Given rootNote = 7 (G), lastPlayedMidi = 71 (B4), Scale = Major [0,2,4,5,7,9,11], stepOffset = -3
    useMidiStore.setState({
      activeState: {
        rootNote: 7, // G
        scaleDecimalId: 2741, // Major (bitmask for [0,2,4,5,7,9,11] relative to root)
        lastPlayedMidi: 71, // B4
        keySwitches: [],
        selectedScaleIndex: 0,
        activeSwitchIndex: 0,
      },
      uiState: {
        activeKeys: [],
        outputActiveKeys: [],
      }
    });

    // Mock LUT entry for Major decimal 2741
    const mockLut = getLUT() || new Array(4096).fill(null);
    mockLut[2741] = {
      decimal: 2741,
      pitch_class_set: [0, 2, 4, 5, 7, 9, 11],
      scale_type: 'Major',
    } as any;

    executeScaleStep(-3);

    const state = useMidiStore.getState();
    expect(state.activeState.lastPlayedMidi).toBe(66); // F#4
    expect(state.uiState.outputActiveKeys).toContain(66);
  });

  it('Phase 2 Checkpoint: applyOutputFilter should strictly evaluate note 74 to 62 under octave_wrap with range [60, 71]', () => {
    const result = applyOutputFilter(74, 'octave_wrap', 60, 71);
    expect(result).toBe(62);
  });
});
