import { create } from 'zustand';
import type { MidiStore, ScaleSwitchData } from '../types/midi';
import { roundToScale } from '../utils/RoundingEngine';
import { getLUT } from '../utils/lutRegistry';

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

const getRootString = (rootNote: number): string => {
  const roots = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  return roots[((rootNote % 12) + 12) % 12];
};
const getScaleTypeString = (decimalId: number): string => {
  const lut = getLUT();
  return (lut && lut[decimalId] && lut[decimalId].scale_type) ? lut[decimalId].scale_type : 'Major';
};

const syncKeySwitches = (state: any, newRoot?: number, newDecimal?: number) => {
  const idx = state.activeState.activeSwitchIndex;
  const currentRoot = newRoot !== undefined ? newRoot : state.activeState.rootNote;
  const currentDecimal = newDecimal !== undefined ? newDecimal : state.activeState.scaleDecimalId;
  
  const updatedSwitches = [...state.activeState.keySwitches];
  updatedSwitches[idx] = {
    root: getRootString(currentRoot),
    type: getScaleTypeString(currentDecimal)
  };
  return updatedSwitches;
};

const computeNewLastPlayedMidi = (
  state: any,
  newRootNote: number | undefined,
  newScaleDecimalId: number | undefined
) => {
  const mode = state.scaleChangeMode;
  const lastPlayed = state.activeState.lastPlayedMidi;
  const decimal = newScaleDecimalId !== undefined ? newScaleDecimalId : state.activeState.scaleDecimalId;
  const pref = state.globalSettings.roundPreference;
  const root = newRootNote !== undefined ? newRootNote : state.activeState.rootNote;
  const startingOctave = state.globalSettings.startOctave;

  if (mode === 'voice-leading') {
    if (lastPlayed !== null && decimal !== null) {
      const lut = getLUT();
      const entry = lut ? lut[decimal] : null;
      const pitch_classes = entry ? entry.pitch_class_set : [0, 2, 4, 5, 7, 9, 11];

      // STRICT FIX: Positive wrapping modulo to prevent downward octave drift
      const absolutePitchClasses = pitch_classes.map((pc: number) => (((root + pc) % 12) + 12) % 12);

      const newNote = roundToScale(lastPlayed, absolutePitchClasses, pref);
      console.log(`[Scale Engine] Voice-Leading. Old: ${lastPlayed}, New: ${newNote}`);
      return newNote;
    }
    return lastPlayed;
  } else {
    // Follow Root — PRP-29/31: Positive-wrapping modulo
    const pc = (((root ?? 0) % 12) + 12) % 12;
    const homeNote = pc + ((startingOctave + 1) * 12);
    console.log(`[Scale Engine] Follow-Root. Root PC: ${pc}, Target Octave: ${startingOctave}, Result: ${homeNote}`);
    return homeNote;
  }
};


export const useMidiStore = create<MidiStore>((set) => ({
  globalSettings: {
    midiInPort: null,
    power: true, // Default to true (bypass is false)
    channelFilter: 'ALL',
    startOctave: 4, // Default to middle octave 4
    roundPreference: 'UP',
    filterMode: 'smart_wrap',
    filterRange: [36, 83],
  },
  activeState: {
    rootNote: 0,
    scaleDecimalId: 2741,
    lastPlayedMidi: 60,
    keySwitches: DEFAULT_KEY_SWITCHES,
    selectedScaleIndex: 0,
    activeSwitchIndex: 0,
    isFirstNote: true,
  },
  uiState: {
    activeKeys: [],
    outputActiveKeys: [],
  },
  playStartSettings: {
    audible: true,
    rounded: false,
    octaveOffset: -2,
  },
  homeSettings: {
    audible: true,
  },
  lutReady: false,
  scaleChangeMode: 'follow-root',

  setMidiInPort: (portId) =>
    set((state) => ({
      globalSettings: { ...state.globalSettings, midiInPort: portId },
    })),

  setPower: (power) =>
    set((state) => {
      const nextGlobalSettings = { ...state.globalSettings, power };
      if (!power) {
        return {
          globalSettings: nextGlobalSettings,
          uiState: {
            ...state.uiState,
            activeKeys: [],
            outputActiveKeys: [],
          },
          activeState: {
            ...state.activeState,
            lastPlayedMidi: null,
          }
        };
      }
      return { globalSettings: nextGlobalSettings };
    }),

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
    set((state) => {
      const nextLastPlayedMidi = computeNewLastPlayedMidi(state, note, undefined);
      const isFirstNote = state.scaleChangeMode === 'follow-root' ? true : state.activeState.isFirstNote;
      return {
        activeState: { 
          ...state.activeState, 
          rootNote: note,
          lastPlayedMidi: nextLastPlayedMidi,
          isFirstNote,
          keySwitches: syncKeySwitches(state, note, undefined)
        },
      };
    }),

  setScaleDecimalId: (decimalId) =>
    set((state) => {
      const nextLastPlayedMidi = computeNewLastPlayedMidi(state, undefined, decimalId);
      const isFirstNote = state.scaleChangeMode === 'follow-root' ? true : state.activeState.isFirstNote;
      return {
        activeState: { 
          ...state.activeState, 
          scaleDecimalId: decimalId,
          lastPlayedMidi: nextLastPlayedMidi,
          isFirstNote,
          keySwitches: syncKeySwitches(state, undefined, decimalId)
        },
      };
    }),

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
    set((state) => {
      const nextActive = { ...state.activeState, ...activeState };
      const nextLastPlayedMidi = computeNewLastPlayedMidi(
        state, 
        activeState.rootNote !== undefined ? activeState.rootNote : undefined, 
        activeState.scaleDecimalId !== undefined ? activeState.scaleDecimalId : undefined
      );
      const finalLastPlayed = activeState.lastPlayedMidi !== undefined 
        ? activeState.lastPlayedMidi 
        : nextLastPlayedMidi;
      const isFirstNote = activeState.isFirstNote !== undefined 
        ? activeState.isFirstNote 
        : (state.scaleChangeMode === 'follow-root' ? true : state.activeState.isFirstNote);
      return {
        activeState: { 
          ...nextActive, 
          lastPlayedMidi: finalLastPlayed,
          isFirstNote,
          keySwitches: syncKeySwitches(state, activeState.rootNote, activeState.scaleDecimalId)
        },
      };
    }),

  setIsFirstNote: (isFirst) =>
    set((state) => ({
      activeState: { ...state.activeState, isFirstNote: isFirst },
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

  updatePlayStartSettings: (settings) =>
    set((state) => ({
      playStartSettings: { ...state.playStartSettings, ...settings },
    })),

  updateHomeSettings: (settings) =>
    set((state) => ({
      homeSettings: { ...state.homeSettings, ...settings },
    })),

  triggerHomeReset: () =>
    set((state) => {
      const rootNote = state.activeState.rootNote ?? 0;
      const startingOctave = state.globalSettings.startOctave;
      // PRP-29: Positive-wrapping modulo (same as computeNewLastPlayedMidi)
      const pc = ((rootNote % 12) + 12) % 12;
      const homeNote = pc + ((startingOctave + 1) * 12);
      return {
        activeState: {
          ...state.activeState,
          lastPlayedMidi: homeNote,
        },
      };
    }),

  setScaleChangeMode: (mode) =>
    set((state) => {
      const nextLastPlayedMidi = computeNewLastPlayedMidi(
        { ...state, scaleChangeMode: mode },
        undefined,
        undefined
      );
      return {
        scaleChangeMode: mode,
        activeState: {
          ...state.activeState,
          lastPlayedMidi: nextLastPlayedMidi
        }
      };
    }),

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
