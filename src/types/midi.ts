export const ZONES = {
  HOME: { min: 21, max: 23 },
  ROOT: { min: 24, max: 35 },
  SCALE: { min: 36, max: 47 },
  STEPPER: { min: 48, max: 72 },
  PLAY_START: { min: 73, max: 108 },
} as const;

export interface PlayStartSettings {
  audible: boolean;
  rounded: boolean;
  octaveOffset: number;
}

export interface PCS_Entry {
  decimal: number;
  chord_type: string;
  data_table_chord_type: string;
  rotation: number;
  root_pc: number;
  chord_intervals: string[];
  chord_intervals_rotated: string[];
  base_triad: string;
  base_7th: string;
  scale_type: string;
  mode: number;
  root_scale: string;
  mode_function: string;
  scale_intervals: string[];
  pitch_class_set: number[];
  "12-bit": string;
  pc_intervals: number[];
  ic_vector: number[];
  cardinality: number;
  diatonic_chromatic_exotic: string;
  hemitonia: number;
  cohemitonia: number;
  brightness: number;
  dissonance: number;
  manual_overrides: string[];
  scale_bk_root_spellings?: Record<string, string>;
}

export interface ScaleSwitchData {
  root: string;
  type: string;
}

export interface ActiveState {
  rootNote: number | null; // e.g., 0 for C, 1 for C#
  scaleDecimalId: number | null; // currently selected scale from 12-key selector
  lastPlayedMidi: number | null; // used for voice-leading calculation
  keySwitches: ScaleSwitchData[];
  selectedScaleIndex: number;
  activeSwitchIndex: number;
  isFirstNote?: boolean;
}

export type StepperActionType = 'STEP' | 'OCTAVE' | 'INVERT_TOGGLE' | 'INVERT_MOMENTARY' | 'HOME' | 'REPEAT_LAST' | 'CUSTOM';
export interface StepperAction { type: StepperActionType; value: number; label: string; }

export interface MidiState {
  globalSettings: {
    midiInPort: string | null;
    power: boolean; // bypass toggle
    channelFilter: number | 'ALL';
    startOctave: number; // 0-7
    roundPreference: 'UP' | 'DOWN';
    filterMode: 'octave_wrap' | 'smart_wrap';
    filterRange: [number, number];
  };
  activeState: ActiveState;
  uiState: {
    activeKeys: number[];     // raw MIDI input keys (all zones)
    outputActiveKeys: number[]; // stepper-processed output keys (for output keyboard)
    stepperInvertToggle: boolean;
    stepperInvertMomentary: boolean;
    stepperConfig: StepperAction[];
    stepperActiveNotes: Record<number, number>;
    lastStepperAction: { type: 'STEP' | 'OCTAVE'; value: number } | null;
  };
  playStartSettings: PlayStartSettings;
  homeSettings: {
    audible: boolean;
  };
  lutReady: boolean; // true once PCS_LUT.dat has finished loading
  scaleChangeMode: 'voice-leading' | 'follow-root';
}

export interface MidiStoreActions {
  setMidiInPort: (portId: string | null) => void;
  setPower: (power: boolean) => void;
  setChannelFilter: (channel: number | 'ALL') => void;
  setStartOctave: (octave: number) => void;
  setRoundPreference: (pref: 'UP' | 'DOWN') => void;
  setFilterMode: (mode: 'octave_wrap' | 'smart_wrap') => void;
  setFilterRange: (range: [number, number]) => void;
  
  setRootNote: (note: number | null) => void;
  setScaleDecimalId: (decimalId: number | null) => void;
  setLastPlayedMidi: (midi: number | null) => void;
  setKeySwitches: (switches: ScaleSwitchData[]) => void;
  setSelectedScaleIndex: (index: number) => void;
  setActiveState: (activeState: Partial<ActiveState>) => void;
  setIsFirstNote: (isFirst: boolean) => void;

  addActiveKey: (key: number) => void;
  removeActiveKey: (key: number) => void;
  clearActiveKeys: () => void;

  processStepperAction: (index: number, isNoteOn: boolean, executeEngineFn?: (offset: number) => number | null) => void;

  addOutputKey: (key: number) => void;
  removeOutputKey: (key: number) => void;
  clearOutputKeys: () => void;

  setLutReady: (ready: boolean) => void;
  updatePlayStartSettings: (settings: Partial<PlayStartSettings>) => void;
  updateHomeSettings: (settings: Partial<{ audible: boolean }>) => void;
  triggerHomeReset: () => void;
  setScaleChangeMode: (mode: 'voice-leading' | 'follow-root') => void;
  
  // Custom reset action for "Panic"
  panic: () => void;
}

export type MidiStore = MidiState & MidiStoreActions;
