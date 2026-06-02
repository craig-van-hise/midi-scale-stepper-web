# PROJECT_STATE.md

# Project State: MIDI Scale Stepper

## 1. Architecture & File Structure

The project directory structure is laid out as follows:

```
/Users/vv2024/Documents/Repos - vv2024/MIDI/WebApps/midi-scale-stepper
├── # Prompts
│   ├── WOs
│   │   └── MIDI-Scale-Stepper-MVP
│   └── xOlder
├── PDD.md
├── PRD.md
├── PROJECT_CONTEXT_BUNDLE.md
├── PROJECT_STATE.md
├── README.md
├── index.html
├── llms.txt
├── package-lock.json
├── package.json
├── project_tree.txt
├── public
│   ├── PCS_LUT.dat
│   └── fonts
│       └── Bravura.woff2
├── src
│   ├── App.test.tsx
│   ├── App.tsx
│   ├── components
│   │   ├── Header.test.tsx
│   │   ├── Header.tsx
│   │   ├── HomeSettingsModal.tsx
│   │   ├── InfoModal.tsx
│   │   ├── KeySplitKeyboard.test-helper.ts
│   │   ├── KeySplitKeyboard.test.tsx
│   │   ├── KeySplitKeyboard.tsx
│   │   ├── KeySwitchContainer.test.tsx
│   │   ├── KeySwitchContainer.tsx
│   │   ├── NoteRangeFilterKeyboard.test.tsx
│   │   ├── NoteRangeFilterKeyboard.tsx
│   │   ├── PlayStartSettingsModal.test.tsx
│   │   ├── PlayStartSettingsModal.tsx
│   │   ├── ScaleChangeSettingsModal.test.tsx
│   │   ├── ScaleChangeSettingsModal.tsx
│   │   ├── ScaleInspectorNotation.test.tsx
│   │   ├── ScaleInspectorNotation.tsx
│   │   ├── ScaleKeySwitches12.test.tsx
│   │   ├── ScaleKeySwitches12.tsx
│   │   ├── ScaleStepperKeySwitches25.test.tsx
│   │   ├── ScaleStepperKeySwitches25.tsx
│   │   ├── SettingsModal.test.tsx
│   │   ├── SettingsModal.tsx
│   │   └── keyboardMap.ts
│   ├── hooks
│   │   ├── useSynth.ts
│   │   ├── useWebMidi.test.tsx
│   │   └── useWebMidi.ts
│   ├── index.css
│   ├── main.tsx
│   ├── store
│   │   ├── useMidiStore.test.ts
│   │   └── useMidiStore.ts
│   ├── test
│   │   └── setup.ts
│   ├── types
│   │   └── midi.ts
│   └── utils
│       ├── BitmaskCalculator.test.ts
│       ├── BitmaskCalculator.ts
│       ├── RoundingEngine.test.ts
│       ├── RoundingEngine.ts
│       ├── ScaleStepperEngine.test.ts
│       ├── ScaleStepperEngine.ts
│       ├── ScaleTransitionEngine.test.ts
│       ├── ScaleTransitionEngine.ts
│       ├── binaryLut.ts
│       ├── lutRegistry.ts
│       ├── notationMath.ts
│       └── scaleSpeller.ts
├── tsconfig.json
└── vite.config.ts
```

## 2. Tech Stack

- **Core**: React 19, TypeScript 5.7, Vite 6.1
- **Styling**: TailwindCSS v4
- **State Management**: Zustand 5.0
- **Testing**: Vitest 3.0, JSDOM 26, React Testing Library 16

## 3. Current System Capabilities

### Functional Modules
- **Audio Engine**: 
  - **MIDI Input Engine (`useWebMidi.ts`)**: Real-time MIDI interception with dual-zone support: C3-B3 for Scale Selection and C4-C6 for Stepper Zone. Includes staggered legato re-triggering prevention, note off ownership validation, and Play/Start output filtering.
  - **Built-in Synth Engine (`useSynth.ts`)**: A lightweight Web Audio API triangle oscillator synth mapping the active MIDI output state to real-time audio playback.
- **Tracking Engine & Zustand Store (`useMidiStore.ts`)**: Global state coordinator handling scale indices, active switches, note history, boundary constraints, "First Note Exception" logic, scale presets synchronization, and active key trackers.
- **Visualizer Modes**:
  - **Music Notation (`ScaleInspectorNotation.tsx`)**: Renders active scales/notes dynamically on a grand staff layout using the Bravura SMuFL font.
  - **Keyboard Components (`KeySplitKeyboard.tsx`, `NoteRangeFilterKeyboard.tsx`, `ScaleStepperKeySwitches25.tsx`, etc.)**: Provide interactive visual previews of active scales, keyboard splits, and range constraint filters.
- **UI State Logic & Settings Modals**: Custom settings modals (`SettingsModal.tsx`, `HomeSettingsModal.tsx`, `PlayStartSettingsModal.tsx`, `ScaleChangeSettingsModal.tsx`) for user-level MIDI configurations, pitch filters, and scale change behaviors (e.g. Follow Root vs Voice Leading).

### Current Work-in-Progress / Status
- **Complete**: All features implemented. Zustand store sync, event routing, physical keyboard mapping, boundary filters, UI controls, and unit tests are complete and passing.

## 4. Recent Evolution

The project has recently completed critical improvements addressing:
1. **Play/Start and Octave Desync**: Resolved the Play/Start note zone bugs by decoupling `lastPlayedMidi` updates from output filtering, correcting visual offsets in the keyboard UI, defaulting the octave offset to -2, and verifying with unit tests.
2. **Legato & Feedback Loop Protection**: Extricated processed/calculated notes from physical active key feedback, added Note Off ownership to prevent premature cutoffs, and addressed legato re-triggering for unison notes.
3. **Scale and Settings Migrations**: Migrated the "On Scale Change Behavior" preference out of the global settings modal into a dedicated `ScaleChangeSettingsModal.tsx` on the Key Switch container, defaulting to "Follow Root", and synced root/scale changes into the keySwitches preset array.
4. **Race Conditions & First Note Exception**: Fixed A0 MIDI race conditions and introduced "First Note Exception" logic to bypass stepping math on initial triggers.
