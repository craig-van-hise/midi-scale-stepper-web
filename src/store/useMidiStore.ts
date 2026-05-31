import { create } from 'zustand';
import type { MidiStore, ScaleSwitchData } from '../types/midi';

const DEFAULT_KEY_SWITCHES: ScaleSwitchData[] = [
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
];

export const useMidiStore = create<MidiStore>((set) => ({
  globalSettings: {
    midiInPort: null,
    power: true, // Default to true (bypass is false)
    channelFilter: 'ALL',
    startOctave: 4, // Default to middle octave 4
    roundPreference: 'UP',
    filterMode: 'octave_wrap',
    filterRange: [21, 108],
  },
  activeState: {
    rootNote: 0,
    scaleDecimalId: 2741,
    lastPlayedMidi: 60,
    keySwitches: DEFAULT_KEY_SWITCHES,
    selectedScaleIndex: 0,
    activeSwitchIndex: 0,
  },
  uiState: {
    activeKeys: [],
    outputActiveKeys: [],
  },
  lutReady: false,

  setMidiInPort: (portId) =>
    set((state) => ({
      globalSettings: { ...state.globalSettings, midiInPort: portId },
    })),

  setPower: (power) =>
    set((state) => ({
      globalSettings: { ...state.globalSettings, power },
    })),

  setChannelFilter: (channel) =>
    set((state) => ({
      globalSettings: { ...state.globalSettings, channelFilter: channel },
    })),

  setStartOctave: (octave) =>
    set((state) => {
      // Constraints check: 0-7
      const clamped = Math.max(0, Math.min(7, octave));
      return {
        globalSettings: { ...state.globalSettings, startOctave: clamped },
      };
    }),

  setRoundPreference: (pref) =>
    set((state) => ({
      globalSettings: { ...state.globalSettings, roundPreference: pref },
    })),

  setFilterMode: (mode) =>
    set((state) => ({
      globalSettings: { ...state.globalSettings, filterMode: mode },
    })),

  setFilterRange: (range) =>
    set((state) => ({
      globalSettings: { ...state.globalSettings, filterRange: range },
    })),

  setRootNote: (note) =>
    set((state) => ({
      activeState: { ...state.activeState, rootNote: note },
    })),

  setScaleDecimalId: (decimalId) =>
    set((state) => ({
      activeState: { ...state.activeState, scaleDecimalId: decimalId },
    })),

  setLastPlayedMidi: (midi) =>
    set((state) => ({
      activeState: { ...state.activeState, lastPlayedMidi: midi },
    })),

  setKeySwitches: (switches) =>
    set((state) => ({
      activeState: { ...state.activeState, keySwitches: switches },
    })),

  setSelectedScaleIndex: (index) =>
    set((state) => ({
      activeState: { ...state.activeState, selectedScaleIndex: index },
    })),

  setActiveState: (activeState) =>
    set((state) => ({
      activeState: { ...state.activeState, ...activeState },
    })),

  addActiveKey: (key) =>
    set((state) => {
      if (state.uiState.activeKeys.includes(key)) return {};
      return {
        uiState: {
          ...state.uiState,
          activeKeys: [...state.uiState.activeKeys, key],
        },
      };
    }),

  removeActiveKey: (key) =>
    set((state) => ({
      uiState: {
        ...state.uiState,
        activeKeys: state.uiState.activeKeys.filter((k) => k !== key),
      },
    })),

  clearActiveKeys: () =>
    set((state) => ({
      uiState: {
        ...state.uiState,
        activeKeys: [],
      },
    })),

  addOutputKey: (key) =>
    set((state) => {
      if (state.uiState.outputActiveKeys.includes(key)) return {};
      return {
        uiState: {
          ...state.uiState,
          outputActiveKeys: [...state.uiState.outputActiveKeys, key],
        },
      };
    }),

  removeOutputKey: (key) =>
    set((state) => ({
      uiState: {
        ...state.uiState,
        outputActiveKeys: state.uiState.outputActiveKeys.filter((k) => k !== key),
      },
    })),

  clearOutputKeys: () =>
    set((state) => ({
      uiState: {
        ...state.uiState,
        outputActiveKeys: [],
      },
    })),

  setLutReady: (ready) =>
    set(() => ({ lutReady: ready })),

  panic: () =>
    set((state) => ({
      uiState: {
        ...state.uiState,
        activeKeys: [],
        outputActiveKeys: [],
      },
      activeState: {
        ...state.activeState,
        lastPlayedMidi: null,
      },
    })),
}));
