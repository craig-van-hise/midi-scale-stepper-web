

# [PDD_Identifier: MIDI-Scale-Stepper-MVP]
**Status:** 🔘 Pending

> The MIDI Scale Stepper MVP is a pure browser-based WebApp that maps specific MIDI key splits to scale degrees, allowing musicians to additively step through musical scales via interval mapping. This phase focuses entirely on internal logical routing, state management, and visual validation via the Web MIDI API, bypassing audio synthesis.

## Architectural Mandates

* **Frontend Stack:** React, TypeScript, Tailwind CSS.
* **Backend/Environment:** Vite (Single Page Application). Hardware I/O handled strictly via the browser's native **Web MIDI API** (`Navigator.requestMIDIAccess`).
* **DevOps/Infra:** Static site deployment (e.g., Vercel, Netlify, or containerized via Docker/Nginx).
* **Typography & Icons:** Google Fonts, Lucide React (MIT Licensed).
* **State Management:** Zustand (Essential for managing fast, transient MIDI state changes without deep prop-drilling or React context rendering penalties).
* **Testing Frameworks:** Vitest (Native Vite integration) and React Testing Library for component validation.
* **Global Dependency Constraints:** Strictly utilize open-source libraries with MIT or permissive equivalents for commercial compliance.

## Global Pre-Computed Logic & Schemas

### Data Models & Schemas

The application relies on a single source of truth for scale definitions and a robust global state for MIDI routing.

**1. `PCS_LUT.dat` (JSON/Dictionary Schema):**

```json
{
  "decimal_id": {
    "name": "Scale Name",
    "scale_intervals": ["1", "b2", "b3", "4", "5", "b6", "b7"],
    "pitch_classes": [0, 1, 3, 5, 7, 8, 10] 
  }
}

```

**2. Zustand Global Store Schema (`useMidiStore`):**

```typescript
interface MidiState {
  globalSettings: {
    midiInPort: string | null;
    power: boolean; // bypass toggle
    channelFilter: number | 'ALL';
    startOctave: number; // 0-7
    roundPreference: 'UP' | 'DOWN';
  };
  activeState: {
    rootNote: number | null; // e.g., 0 for C, 1 for C#
    scaleDecimalId: number | null; // currently selected scale from 12-key selector
    lastPlayedMidi: number | null; // used for voice-leading calculation
  };
  uiState: {
    activeKeys: number[]; // currently depressed keys across all splits
  }
}

```

### Core Algorithms

**Algorithm 1: MIDI Selection & Bitmask Parsing**
To derive the integer index for the `PCS_LUT` lookup based on incoming chord/scale MIDI data:

1. **Extract Pitches:** Given an array of active MIDI notes $N = [n_1, n_2, ... n_x]$.
2. **Determine Bass:** $bass\_note = \min(N) \implies bass\_pc = bass\_note \pmod{12}$.
3. **Normalize to Bass:** For each note $n$ in $N$, find its relative pitch class: $normalized\_pc = (n \pmod{12} - bass\_pc + 12) \pmod{12}$.
4. **Bitmask Generation:** Create a 12-bit binary string where index $i$ is `1` if $i \in normalized\_pcs$, else `0`. (Index 0 is the left-most bit).
5. **Reflection & Decimal Conversion:** Reverse the 12-bit string. Convert the reversed binary string to a base-10 decimal. Use this decimal as the key for `PCS_LUT`.

**Algorithm 2: Out-of-Scale Handling (Rounding Algorithm)**
When a calculated step target $T$ lands on a pitch class $P_{target}$ not present in the active `PCS_LUT.pitch_classes` array:

1. **If `roundPreference === 'UP'`:** Iterate $P_{target} + 1 \pmod{12}$ until a matching pitch class in the scale array is found. Output that note. If wrapping past 11, increment the target octave by 1.
2. **If `roundPreference === 'DOWN'`:** Iterate $P_{target} - 1 \pmod{12}$ until a matching pitch class is found. Output that note. If wrapping below 0, decrement the target octave by 1.

**Algorithm 3: Scale Transition & Voice-Leading Fallback**
Triggered when the user changes the active scale while holding/sustaining a note:

1. Extract pitch class of `lastPlayedMidi`: $P_{last} = lastPlayedMidi \pmod{12}$.
2. Check if $P_{last} \in new\_scale.pitch\_classes$.
3. If true, $new\_output\_note = lastPlayedMidi$.
4. If false, execute **Algorithm 2** starting from $P_{last}$ using the new scale boundaries to snap to the nearest valid note.

---

## Phase 1: Web Application Boilerplate & Web MIDI Integration
**Status:** 🔘 Pending | **HITL Required:** True

* **Objective:** Establish the foundational Vite SPA, global type declarations, and hardware permissions.
* **Required Implementations:**
* Initialize a Vite + React + TypeScript web application.
* Configure Tailwind CSS and inject Google Fonts.
* Define the TypeScript interfaces mapped exactly to the `Zustand Global Store Schema` outlined above.
* Implement a `useWebMidi` custom React Hook that invokes `Navigator.requestMIDIAccess()`, requests browser permissions, and pipes standard MIDI event messages (Note On/Note Off) directly into the Zustand store's `uiState.activeKeys`.
* Parse `PCS_LUT.dat` into a static TypeScript map upon application load so it remains strictly in browser memory for zero-latency lookups.



## Phase 2: Core Algorithmic Engine (Math & Routing)
**Status:** 🔘 Pending | **HITL Required:** False

* **Objective:** Implement the headless MIDI logic layer to process math independently from React renders.
* **Required Implementations:**
* Build `BitmaskCalculator.ts` strictly implementing **Algorithm 1**, verifying the reflection logic against standard chord types (e.g., Major Triad must resolve to `100010010000` -> Reversed: `000010010001` -> Decimal `145`).
* Build `RoundingEngine.ts` implementing **Algorithm 2**, ensuring the modulo arithmetic accurately adjusts octaves when rounding crosses the C-boundary (e.g., A# rounding up to C must push to the next octave integer).
* Build `ScaleTransitionEngine.ts` utilizing **Algorithm 3** to manage state diffing when `activeState.scaleDecimalId` changes.



## Phase 3: Global Header & Settings Infrastructure
**Status:** 🔘 Pending | **HITL Required:** True

* **Objective:** Build the global control UI elements prioritizing a light theme and white cards.
* **Required Implementations:**
* Construct the Title Bar utilizing Lucide React icons for controls. Map Power/Bypass toggle to `MidiState.globalSettings.power`.
* Wire the "Panic (!)" button to emit a global array clear on `uiState.activeKeys` and reset `activeState.lastPlayedMidi` to `null`.
* Build Settings Modal (Cog) to expose state mutations for: Web MIDI Input Port Selector, Channel Filter, Starting Octave (range constraints: 0-7), and the binary "Round Up / Round Down" preference toggle.
* Build Info Modal (i) containing static product data (Craig Van Hise, links).



## Phase 4: Input Keyboard Components & Key Splits
**Status:** 🔘 Pending | **HITL Required:** True

* **Objective:** Implement the top card `KeySplitKeyboard.jsx` using existing architecture mapped to our required split zones.
* **Required Implementations:**
* Import and refactor `KeySplitKeyboard.jsx`.
* Establish hardcoded rendering parameters based on exact MIDI notes:
* Root Select (Orange): MIDI Notes 36-47 (C2-B2). Sets `MidiState.activeState.rootNote`.
* Scale Select (Yellow): MIDI Notes 48-59 (C3-B3).
* Stepper (Blue): MIDI Notes 60-84 (C4-C6).
* Thru (Slate Grey): Notes `< 36` and `> 84`. Passes raw MIDI data directly to Output view.


* Ensure keys visualize active touches via `uiState.activeKeys` matching.



## Phase 5: KeySwitch UI & Middle Card Layout
**Status:** 🔘 Pending | **HITL Required:** True

* **Objective:** Build the dual side-by-side keyboard container for specialized functionality states.
* **Required Implementations:**
* Construct a Flex/Grid layout middle container wrapper.
* Refactor `ScaleKeySwitches12.tsx` (Left side). Hardcode the internal dropdown to the specified MVP roster: Major, Melodic Minor, Harmonic Minor, Harmonic Major, Major Pentatonic, Minor Pentatonic, Augmented, Whole Tone, Diminished, Chromatic. Map these selections to internal decimals.
* Refactor `ScaleStepperKeySwitches25.tsx` (Right side). Strip out dynamic interval text. Inject static additive index labels mapping from center: `-12` to `+12` (or `0` at root).



## Phase 6: Notation View & Output Visualization
**Status:** 🔘 Pending | **HITL Required:** True

* **Objective:** Finalize visual output validators to confirm logical accuracy.
* **Required Implementations:**
* Integrate `ScaleInspectorNotation.tsx` (Lower-Middle Card). Establish a `useEffect` dependency on `MidiState.activeState.lastPlayedMidi` to trigger the highlight visual on the generated staff.
* Refactor `NoteRangeFilterKeyboard.jsx` (Bottom Card).
* Strip the range slider UI of integer inputs and strictly map slider bounds to standard note names (e.g., C1, C8).
* Lock the internal settings menu strictly to "Octave Wrap" and "Smart Wrap" toggles.
* Pipe the final calculated output of **Algorithm 3** / **Algorithm 2** into this keyboard component to visually depress the resulting target key.