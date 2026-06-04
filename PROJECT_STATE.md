# PROJECT_STATE.md

# Project State: MIDI Scale Stepper

## 1. Architecture & File Structure

The project directory structure is laid out as follows:

```
/Users/vv2024/Documents/Repos - vv2024/MIDI/WebApps/midi-scale-stepper
├── # Prompts
│   ├── # 61.md
│   ├── # 62.md
│   ├── # 63.md
│   ├── WOs
│   │   └── ...
│   └── xOlder
│       └── ...
├── FONTS.md
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
│   │   ├── InputSettingsModal.test.tsx
│   │   ├── InputSettingsModal.tsx
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
│   │   ├── ScaleStepperKeySwitches24.test.tsx
│   │   ├── ScaleStepperKeySwitches24.tsx
│   │   ├── SettingsModal.test.tsx
│   │   ├── SettingsModal.tsx
│   │   ├── StepperContextMenu.test.tsx
│   │   ├── StepperContextMenu.tsx
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
- **Styling**: TailwindCSS v4 (using vanilla CSS theme variables)
- **State Management**: Zustand 5.0
- **Testing**: Vitest 3.0, JSDOM 26, React Testing Library 16

## 3. Current System Capabilities

### Functional Modules
- **Audio Engine**: 
  - **MIDI Input Engine (`useWebMidi.ts`)**: Real-time MIDI interception with dual-zone support: C3-B3 for Scale Selection and C4-C6 for Stepper Zone. Includes staggered legato re-triggering prevention, note off ownership validation, and Play/Start output filtering. Supports configurable physical keyboard size truncation.
  - **Built-in Synth Engine (`useSynth.ts`)**: A lightweight Web Audio API triangle oscillator synth mapping the active MIDI output state to real-time audio playback.
- **Tracking Engine & Zustand Store (`useMidiStore.ts`)**: Global state coordinator handling scale indices, active switches, note history, boundary constraints, "First Note Exception" logic, scale presets synchronization, custom stepper configurations, and active key trackers.
- **Visualizer Modes**:
  - **Music Notation (`ScaleInspectorNotation.tsx`)**: Renders active scales/notes dynamically on a grand staff layout using the Bravura SMuFL font, styled with standardized Outfit, Inter, and Roboto Mono typography.
  - **Keyboard Components (`KeySplitKeyboard.tsx`, `NoteRangeFilterKeyboard.tsx`, `ScaleStepperKeySwitches24.tsx`, etc.)**: Provide interactive visual previews of active scales, keyboard splits, and range constraint filters.
- **UI State Logic & Settings Modals**: Custom settings modals (`SettingsModal.tsx`, `HomeSettingsModal.tsx`, `PlayStartSettingsModal.tsx`, `ScaleChangeSettingsModal.tsx`, `InputSettingsModal.tsx`) for user-level MIDI configurations, pitch filters, input keyboard sizes, and scale change behaviors (e.g. Follow Root vs Voice Leading).
- **Interactive Triggers & Context Menus**: `StepperContextMenu.tsx` allows right-click custom configurations for the 24 stepper keys (Step Offset, Octave Offset, Invert Toggle/Momentary, Home Reset, Repeat Last Action, Custom Bypass).

### Current Work-in-Progress / Status
- **Complete**: All features implemented. Zustand store sync, event routing, physical keyboard mapping, boundary filters, UI controls, and unit tests are complete and passing.

## 4. Recent Evolution

The project has recently completed critical improvements addressing:
1. **Typography Standardization**: Standardized fonts across the application to a cohesive design system using Google Fonts (Outfit for headers, Inter for UI text/labels, and Roboto Mono for intervals and tabular text).
2. **Keyboard Inversion Bug Fix**: Stripped inversion-awareness from `KeySplitKeyboard.tsx` handlers to make it a dumb physical controller passing raw index data, resolving the double-inversion bug.
3. **UI Layout Alignment**: Realigned the Octave Knob absolute positioning above the Play/Start zone using precise midpoint centering math relative to its layout margins.
4. **Input Size & Context Menus**: Added physical keyboard size truncation configurations (88-key vs 49-key modes) via `InputSettingsModal.tsx` and custom per-key action triggers (Invert, Octave, Reset, Repeat) via `StepperContextMenu.tsx`.
5. **Legato & Feedback Protection**: Extricated calculated notes from active physical key feedback and added note-off ownership validation.
