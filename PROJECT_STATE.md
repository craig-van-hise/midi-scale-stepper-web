# PROJECT_STATE.md

# Project State: MIDI Scale Stepper MVP

## 1. Architecture & File Structure

The project directory structure is laid out as follows:

```
/Users/vv2024/Documents/Repos - vv2024/MIDI/WebApps/midi-scale-stepper
├── PDD.md
├── PRD.md
├── README.md
├── index.html
├── package-lock.json
├── package.json
├── public
│   ├── PCS_LUT.dat
│   └── fonts
│       └── Bravura.woff2
├── src
│   ├── App.tsx
│   ├── components
│   │   ├── Header.test.tsx
│   │   ├── Header.tsx
│   │   ├── InfoModal.tsx
│   │   ├── KeySplitKeyboard.test-helper.ts
│   │   ├── KeySplitKeyboard.test.tsx
│   │   ├── KeySplitKeyboard.tsx
│   │   ├── KeySwitchContainer.test.tsx
│   │   ├── KeySwitchContainer.tsx
│   │   ├── NoteRangeFilterKeyboard.test.tsx
│   │   ├── NoteRangeFilterKeyboard.tsx
│   │   ├── ScaleInspectorNotation.tsx
│   │   ├── ScaleKeySwitches12.tsx
│   │   ├── ScaleStepperKeySwitches25.test.tsx
│   │   ├── ScaleStepperKeySwitches25.tsx
│   │   ├── SettingsModal.tsx
│   │   └── keyboardMap.ts
│   ├── hooks
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
- **MIDI Input Engine (`useWebMidi.ts`)**: Real-time MIDI interception with dual-zone support:
  - **Scale Select Zone (C3-B3)**: Updates the active scale in the store.
  - **Stepper Zone (C4-C6)**: Computes dynamic offsets in scale indexes and executes scale steps.
- **Zustand Store (`useMidiStore.ts`)**: Central state manager containing global settings, active states (rootNote, scaleDecimalId, selectedScaleIndex, activeSwitchIndex, lastPlayedMidi), and interactive keyboard states. All state updates are driven deterministically by event hooks.
- **Scale Stepper Engine (`ScaleStepperEngine.ts`)**: Resolves step offsets against the selected Pitch Class Set (PCS), transposes the pitch classes, and applies boundary constraints (`octave_wrap` and `smart_wrap`) through `applyOutputFilter`.
- **LUT Registry (`lutRegistry.ts`, `binaryLut.ts`)**: Decodes the compressed binary lookup table `public/PCS_LUT.dat` into memory at startup to supply active pitch classes.

### Current Work-in-Progress / Status
- **Complete**: All features implemented. Zustand store sync, event routing, physical keyboard mapping, boundary filters, UI controls, and unit tests are complete and passing.

## 4. Recent Evolution

The project has recently completed all core routing, integration tests, scale-select lift into Zustand, and physical MIDI inputs mapping. A high-fidelity documentation setup (`README.md`) has been created, and version control initialization is underway.
