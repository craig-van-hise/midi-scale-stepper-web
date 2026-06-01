import { describe, it, expect, beforeEach } from 'vitest';
import { useMidiStore } from './useMidiStore';
import { getLUT, setLUT } from '../utils/lutRegistry';

describe('useMidiStore', () => {
  beforeEach(() => {
    useMidiStore.getState().panic();
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
        keySwitches: [
          { root: 'C', type: 'Major' },
          { root: 'C#', type: 'Dorian' },
          { root: 'D', type: 'Phrygian' },
          { root: 'D#', type: 'Lydian' },
          { root: 'E', type: 'Mixolydian' },
          { root: 'F', type: 'Natural Minor' },
          { root: 'F#', type: 'Locrian' },
          { root: 'G', type: 'Harmonic Minor' },
          { root: 'G#', type: 'Melodic Minor' },
          { root: 'A', type: 'Pentatonic Major' },
          { root: 'A#', type: 'Pentatonic Minor' },
          { root: 'B', type: 'Blues' }
        ],
        selectedScaleIndex: 0,
        activeSwitchIndex: 0,
        isFirstNote: true,
      },
      uiState: {
        activeKeys: [],
        outputActiveKeys: [],
      },
      scaleChangeMode: 'follow-root',
    });
  });

  it('should initialize with correct default activeState values on mount', () => {
    const store = useMidiStore.getState();
    expect(store.activeState.rootNote).toBe(0);
    expect(store.activeState.scaleDecimalId).toBe(2741);
    expect(store.activeState.lastPlayedMidi).toBe(60);
    expect(store.activeState.keySwitches.length).toBe(12);
    expect(store.activeState.selectedScaleIndex).toBe(0);
    expect(store.activeState.activeSwitchIndex).toBe(0);
    expect(store.activeState.isFirstNote).toBe(true);
  });

  it('should initialize with correct default filterMode as smart_wrap', () => {
    const store = useMidiStore.getState();
    expect(store.globalSettings.filterMode).toBe('smart_wrap');
  });

  it('should initialize with correct default filterRange as [36, 83]', () => {
    const store = useMidiStore.getState();
    expect(store.globalSettings.filterRange).toEqual([36, 83]);
  });

  it('should add active keys uniquely', () => {
    const store = useMidiStore.getState();
    expect(store.uiState.activeKeys).toEqual([]);

    store.addActiveKey(60);
    expect(useMidiStore.getState().uiState.activeKeys).toEqual([60]);

    // Ensure uniqueness
    store.addActiveKey(60);
    expect(useMidiStore.getState().uiState.activeKeys).toEqual([60]);

    store.addActiveKey(62);
    expect(useMidiStore.getState().uiState.activeKeys).toEqual([60, 62]);
  });

  it('should remove active keys', () => {
    const store = useMidiStore.getState();
    store.addActiveKey(60);
    store.addActiveKey(62);
    expect(useMidiStore.getState().uiState.activeKeys).toEqual([60, 62]);

    store.removeActiveKey(60);
    expect(useMidiStore.getState().uiState.activeKeys).toEqual([62]);
  });

  it('should clamp startOctave to 0-7', () => {
    const store = useMidiStore.getState();
    
    store.setStartOctave(5);
    expect(useMidiStore.getState().globalSettings.startOctave).toBe(5);

    store.setStartOctave(8);
    expect(useMidiStore.getState().globalSettings.startOctave).toBe(7);

    store.setStartOctave(-1);
    expect(useMidiStore.getState().globalSettings.startOctave).toBe(0);
  });

  it('should handle panic reset', () => {
    const store = useMidiStore.getState();
    store.addActiveKey(60);
    store.setLastPlayedMidi(60);
    
    store.panic();
    
    expect(useMidiStore.getState().uiState.activeKeys).toEqual([]);
    expect(useMidiStore.getState().activeState.lastPlayedMidi).toBeNull();
  });

  it('should update playStartSettings defaults correctly', () => {
    const store = useMidiStore.getState();
    expect(store.playStartSettings).toEqual({ audible: true, rounded: false, octaveOffset: 0 });
    
    store.updatePlayStartSettings({ rounded: true });
    expect(useMidiStore.getState().playStartSettings).toEqual({ audible: true, rounded: true, octaveOffset: 0 });
  });

  it('should calculate and update lastPlayedMidi on triggerHomeReset - Test Case 1 (C4)', () => {
    const store = useMidiStore.getState();
    store.setRootNote(0);
    store.setStartOctave(4);
    store.triggerHomeReset();
    expect(useMidiStore.getState().activeState.lastPlayedMidi).toBe(60);
  });

  it('should calculate and update lastPlayedMidi on triggerHomeReset - Test Case 2 (G2)', () => {
    const store = useMidiStore.getState();
    store.setRootNote(7);
    store.setStartOctave(2);
    store.triggerHomeReset();
    expect(useMidiStore.getState().activeState.lastPlayedMidi).toBe(43);
  });

  it('Test Case 1 (Voice-Leading): Given C Major, lastPlayedMidi = 60. Change scale to Db Major. Assert lastPlayedMidi rounds to 61 (Db4)', () => {
    const store = useMidiStore.getState();
    // Setup Mock LUT with Dorian (1709) and Major (2741)
    const mockLut = getLUT() || new Array(4096).fill(null);
    mockLut[2741] = { decimal: 2741, pitch_class_set: [0, 2, 4, 5, 7, 9, 11] };
    mockLut[1709] = { decimal: 1709, pitch_class_set: [0, 2, 3, 5, 7, 9, 10] }; // Dorian
    setLUT(mockLut);

    store.setScaleChangeMode('voice-leading');
    useMidiStore.setState({
      globalSettings: {
        ...store.globalSettings,
        roundPreference: 'UP',
      },
      activeState: {
        ...store.activeState,
        rootNote: 0,
        scaleDecimalId: 2741, // C Major
        lastPlayedMidi: 60,
      }
    });

    // Change to C# Dorian (index 1 in switches - rootNote = 1, scaleDecimalId = 1709)
    store.setActiveState({
      activeSwitchIndex: 1,
      rootNote: 1,
      scaleDecimalId: 1709,
    });

    expect(useMidiStore.getState().activeState.lastPlayedMidi).toBe(61);
  });

  it('Test Case 2 (Follow Root): Given startingOctave = 4, rootNote = 2 (D). Change scale. Assert lastPlayedMidi jumps to 62 (D4)', () => {
    const store = useMidiStore.getState();
    store.setScaleChangeMode('follow-root');
    useMidiStore.setState({
      globalSettings: {
        ...store.globalSettings,
        startOctave: 4,
      },
      activeState: {
        ...store.activeState,
        rootNote: 2, // D
        scaleDecimalId: 2741,
        lastPlayedMidi: 60,
      }
    });

    // Change scale trigger
    store.setActiveState({
      scaleDecimalId: 1709,
    });

    expect(useMidiStore.getState().activeState.lastPlayedMidi).toBe(62);
  });

  // ─── PRP-29: Follow-Root Logic Fix ──────────────────────────────────────────

  // Phase 1 — Test Case 1 (Negative Root / JS modulo bug)
  it('Phase1-TC1: follow-root with negative rootNote (-5 = G) at octave 4 should set lastPlayedMidi to 67 (G4)', () => {
    const store = useMidiStore.getState();
    store.setScaleChangeMode('follow-root');
    useMidiStore.setState({
      globalSettings: {
        ...store.globalSettings,
        startOctave: 4,
      },
      activeState: {
        ...store.activeState,
        rootNote: -5, // G (JS: -5 % 12 = -5, so old code gives 55 not 67)
        scaleDecimalId: 2741,
        lastPlayedMidi: 60,
      },
    });

    // Trigger a scale change — this must call evaluateScaleChangeMode internally
    useMidiStore.getState().setScaleDecimalId(2741);

    // G4 = pc 7 + (4+1)*12 = 7 + 60 = 67
    expect(useMidiStore.getState().activeState.lastPlayedMidi).toBe(67);
  });

  // Phase 2 — Test Case 1: setRootNote fires evaluateScaleChangeMode
  it('Phase2-TC1: setRootNote in follow-root mode updates lastPlayedMidi immediately to the new root at startOctave', () => {
    const store = useMidiStore.getState();
    store.setScaleChangeMode('follow-root');
    useMidiStore.setState({
      globalSettings: { ...store.globalSettings, startOctave: 4 },
      activeState: { ...store.activeState, rootNote: 0, lastPlayedMidi: 60 },
    });

    // Change root note to D (2)
    useMidiStore.getState().setRootNote(2);

    // D4 = pc 2 + 60 = 62
    expect(useMidiStore.getState().activeState.lastPlayedMidi).toBe(62);
  });

  // Phase 2 — Test Case 2: setScaleDecimalId fires evaluateScaleChangeMode
  it('Phase2-TC2: setScaleDecimalId in follow-root mode updates lastPlayedMidi to the current root at startOctave', () => {
    const store = useMidiStore.getState();
    store.setScaleChangeMode('follow-root');
    useMidiStore.setState({
      globalSettings: { ...store.globalSettings, startOctave: 4 },
      activeState: { ...store.activeState, rootNote: 5, scaleDecimalId: 2741, lastPlayedMidi: 60 },
    });

    // Change scale type (decimal) — root stays at 5 (F)
    useMidiStore.getState().setScaleDecimalId(1709);

    // F4 = pc 5 + 60 = 65
    expect(useMidiStore.getState().activeState.lastPlayedMidi).toBe(65);
  });

  // ─── Phase 1 TDD Checkpoints ──────────────────────────────────────────
  it('Phase 1 - Test Case 1: Given initial store state, Assert activeState.isFirstNote is true and activeState.lastPlayedMidi is 60', () => {
    const store = useMidiStore.getState();
    expect(store.activeState.isFirstNote).toBe(true);
    expect(store.activeState.lastPlayedMidi).toBe(60);
  });

  it('Phase 1 - Test Case 2: Given scaleChangeMode is follow-root, When setRootNote(2) is called, Assert isFirstNote resets to true', () => {
    const store = useMidiStore.getState();
    store.setScaleChangeMode('follow-root');
    // Set isFirstNote to false manually first
    store.setIsFirstNote(false);
    expect(useMidiStore.getState().activeState.isFirstNote).toBe(false);

    store.setRootNote(2);
    expect(useMidiStore.getState().activeState.isFirstNote).toBe(true);
  });

  it('Phase 1 - Test Case 3: Given scaleChangeMode is voice-leading, When setRootNote(2) is called, Assert isFirstNote retains its previous boolean state', () => {
    const store = useMidiStore.getState();
    store.setScaleChangeMode('voice-leading');
    
    // Test retaining false
    store.setIsFirstNote(false);
    store.setRootNote(2);
    expect(useMidiStore.getState().activeState.isFirstNote).toBe(false);

    // Test retaining true
    store.setIsFirstNote(true);
    store.setRootNote(3);
    expect(useMidiStore.getState().activeState.isFirstNote).toBe(true);
  });

  // ─── Prompt 36 TDD Checkpoints ──────────────────────────────────────────
  it('Prompt 36 - Test Case 1: Given a mocked store where activeState.isFirstNote is false, When triggerHomeReset() is called, Assert activeState.isFirstNote remains false', () => {
    const store = useMidiStore.getState();
    store.setIsFirstNote(false);
    expect(useMidiStore.getState().activeState.isFirstNote).toBe(false);

    store.triggerHomeReset();
    expect(useMidiStore.getState().activeState.isFirstNote).toBe(false);
  });

  it('Prompt 36 - Test Case 2: Given a mocked store where activeState.isFirstNote is false and lastPlayedMidi is 62, When triggerHomeReset() is called, Assert lastPlayedMidi correctly updates to the home root note, but isFirstNote remains false', () => {
    const store = useMidiStore.getState();
    useMidiStore.setState({
      activeState: {
        ...store.activeState,
        rootNote: 0, // C
        lastPlayedMidi: 62, // D4
        isFirstNote: false,
      }
    });

    useMidiStore.getState().triggerHomeReset();
    expect(useMidiStore.getState().activeState.lastPlayedMidi).toBe(60); // C4 (home note for root 0, startOctave 4)
    expect(useMidiStore.getState().activeState.isFirstNote).toBe(false);
  });

  it('Phase 1 - Test Case 1: Given store initialization, When fetching scaleChangeMode, Assert it equals follow-root', () => {
    // We expect the default state of the actual imported store (without beforeEach override if any, or matching the initial state)
    // The default state defined in useMidiStore is 'follow-root'
    const store = useMidiStore.getState();
    expect(store.scaleChangeMode).toBe('follow-root');
  });

  it('Phase 2 Test Case 1: Given activeSwitchIndex is 0 and current preset is C Major, When setRootNote(2) is called (D), Assert activeState.keySwitches[0].root updates to D', () => {
    const store = useMidiStore.getState();
    useMidiStore.setState({
      activeState: {
        ...store.activeState,
        activeSwitchIndex: 0,
        rootNote: 0, // C
        scaleDecimalId: 2741, // Major
        keySwitches: [
          { root: 'C', type: 'Major' },
          { root: 'C#', type: 'Dorian' },
        ]
      }
    });

    useMidiStore.getState().setRootNote(2); // D
    expect(useMidiStore.getState().activeState.keySwitches[0].root).toBe('D');
    expect(useMidiStore.getState().activeState.keySwitches[0].type).toBe('Major'); // Unchanged
  });

  it('Phase 2 Test Case 2: Given activeSwitchIndex is 1, When setActiveState({ scaleDecimalId: 1709 }) is called, Assert activeState.keySwitches[1].type updates to Dorian', () => {
    const store = useMidiStore.getState();
    
    // Setup Mock LUT
    const mockLut = getLUT() || new Array(4096).fill(null);
    mockLut[2741] = { decimal: 2741, pitch_class_set: [0, 2, 4, 5, 7, 9, 11], scale_type: 'Major' };
    mockLut[1709] = { decimal: 1709, pitch_class_set: [0, 2, 3, 5, 7, 9, 10], scale_type: 'Dorian' }; // Dorian
    setLUT(mockLut);

    useMidiStore.setState({
      lutReady: true,
      activeState: {
        ...store.activeState,
        activeSwitchIndex: 1,
        rootNote: 1, // C#
        scaleDecimalId: 2741,
        keySwitches: [
          { root: 'C', type: 'Major' },
          { root: 'C#', type: 'Major' },
        ]
      }
    });

    useMidiStore.getState().setActiveState({
      scaleDecimalId: 1709,
    });

    expect(useMidiStore.getState().activeState.keySwitches[1].type).toBe('Dorian');
    expect(useMidiStore.getState().activeState.keySwitches[1].root).toBe('C#'); // Unchanged
  });
});
