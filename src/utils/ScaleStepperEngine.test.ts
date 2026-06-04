import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useMidiStore } from '../store/useMidiStore';
import { executeScaleStep, applyOutputFilter } from './ScaleStepperEngine';
import { getLUT } from './lutRegistry';

describe('ScaleStepperEngine & Phase 1/2 Verification', () => {
  beforeEach(() => {
    useMidiStore.getState().panic();
    // Default mock setup
  });

  it('Phase 1 Checkpoint: should correctly calculate stepOffset from note 48 (-12) and note 72 (+12)', () => {
    const noteLow = 48;
    const stepOffsetLow = noteLow - 60;
    expect(stepOffsetLow).toBe(-12);

    const noteHigh = 72;
    const stepOffsetHigh = noteHigh - 60;
    expect(stepOffsetHigh).toBe(12);
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
        isFirstNote: false,
      },
      uiState: {
        ...useMidiStore.getState().uiState,
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

  // ─── Phase 2 TDD Checkpoints ──────────────────────────────────────────
  it('Phase 2 - Test Case 1: Given a mocked store where isFirstNote is true and lastPlayedMidi is 60, When executeScaleStep(+1) is called, Assert output is 60 and store.setIsFirstNote(false) is invoked', () => {
    const mockLut = getLUT() || new Array(4096).fill(null);
    mockLut[2741] = {
      decimal: 2741,
      pitch_class_set: [0, 2, 4, 5, 7, 9, 11],
      scale_type: 'Major',
    } as any;

    useMidiStore.setState({
      globalSettings: {
        midiInPort: null,
        power: true,
        channelFilter: 'ALL',
        startOctave: 4,
        roundPreference: 'UP',
        filterMode: 'smart_wrap',
        filterRange: [36, 83],
      },
      activeState: {
        rootNote: 0,
        scaleDecimalId: 2741,
        lastPlayedMidi: 60,
        keySwitches: [],
        selectedScaleIndex: 0,
        activeSwitchIndex: 0,
        isFirstNote: true,
      },
      uiState: {
        ...useMidiStore.getState().uiState,
        activeKeys: [],
        outputActiveKeys: [],
      }
    });

    const result = executeScaleStep(1);
    expect(result).toBe(60);
    expect(useMidiStore.getState().activeState.isFirstNote).toBe(false);
  });

  it('Phase 2 - Test Case 2: Given a mocked store where isFirstNote is false and lastPlayedMidi is 60, When executeScaleStep(+1) is called, Assert the standard offset math runs (e.g., output is 62 in Major scale) and the flag is not toggled', () => {
    const mockLut = getLUT() || new Array(4096).fill(null);
    mockLut[2741] = {
      decimal: 2741,
      pitch_class_set: [0, 2, 4, 5, 7, 9, 11],
      scale_type: 'Major',
    } as any;

    useMidiStore.setState({
      globalSettings: {
        midiInPort: null,
        power: true,
        channelFilter: 'ALL',
        startOctave: 4,
        roundPreference: 'UP',
        filterMode: 'smart_wrap',
        filterRange: [36, 83],
      },
      activeState: {
        rootNote: 0,
        scaleDecimalId: 2741,
        lastPlayedMidi: 60,
        keySwitches: [],
        selectedScaleIndex: 0,
        activeSwitchIndex: 0,
        isFirstNote: false,
      },
      uiState: {
        ...useMidiStore.getState().uiState,
        activeKeys: [],
        outputActiveKeys: [],
      }
    });

    const result = executeScaleStep(1);
    expect(result).toBe(62);
    expect(useMidiStore.getState().activeState.isFirstNote).toBe(false);
  });

  it('Phase 2 Checkpoint: Test Case 1 - Given a mocked store where outputActiveKeys already includes 62, When executeScaleStep(0) resolves to 62, Assert removeOutputKey(62) is called immediately, and addOutputKey(62) is scheduled via timeout', () => {
    vi.useFakeTimers();

    const mockLut = getLUT() || new Array(4096).fill(null);
    mockLut[2741] = {
      decimal: 2741,
      pitch_class_set: [0, 2, 4, 5, 7, 9, 11],
      scale_type: 'Major',
    } as any;

    useMidiStore.setState({
      globalSettings: {
        midiInPort: null,
        power: true,
        channelFilter: 'ALL',
        startOctave: 4,
        roundPreference: 'UP',
        filterMode: 'octave_wrap',
        filterRange: [21, 108],
      },
      activeState: {
        rootNote: 2,
        scaleDecimalId: 2741,
        lastPlayedMidi: 62,
        keySwitches: [],
        selectedScaleIndex: 0,
        activeSwitchIndex: 0,
        isFirstNote: false,
      },
      uiState: {
        ...useMidiStore.getState().uiState,
        activeKeys: [],
        outputActiveKeys: [62],
      }
    });

    const removeOutputKeySpy = vi.spyOn(useMidiStore.getState(), 'removeOutputKey');
    const addOutputKeySpy = vi.spyOn(useMidiStore.getState(), 'addOutputKey');

    // Execute scale step 0 (keeps note on 62)
    const result = executeScaleStep(0);
    expect(result).toBe(62);

    expect(removeOutputKeySpy).toHaveBeenCalledWith(62);
    expect(addOutputKeySpy).not.toHaveBeenCalledWith(62);

    vi.advanceTimersByTime(5);

    expect(addOutputKeySpy).toHaveBeenCalledWith(62);

    vi.useRealTimers();
  });
});
