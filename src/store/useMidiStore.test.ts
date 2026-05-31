import { describe, it, expect, beforeEach } from 'vitest';
import { useMidiStore } from './useMidiStore';

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
        filterMode: 'octave_wrap',
        filterRange: [21, 108],
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
      },
      uiState: {
        activeKeys: [],
        outputActiveKeys: [],
      },
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
});
