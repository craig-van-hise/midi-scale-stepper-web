# WORK ORDER: 6-13_ui-coder
**Status:** 🔘 Pending
**Description:** Implement the Scale Inspector Notation card and the Note Range Filter Keyboard (Output Keyboard) visualizing output notes.

### **ID Composition**
> **Format:** `{Batch}-{Track Number}_{Persona ID}`
* **`6` (Batch):** The synchronous deployment phase.
* **`13` (Track Number):** The agent’s fixed vertical placement (1-15).
* **`ui-coder`:** The unique functional identifier using kebab-case.
* **Note on Status Icons:** 🔘 Pending | 🔵 Active | ✅ Completed | 🚨 Error | ❌ Canceled

## Agent Invocation
* **Agent Role:** ~/.gemini/agents/ui-coder.md

## 1. Project Context & Objectives
* **Working Directory:** `/Users/vv2024/Documents/Repos - vv2024/MIDI/WebApps/midi-scale-stepper`
* **Files in Scope:** `src/components/ScaleInspectorNotation.tsx`, `src/components/NoteRangeFilterKeyboard.tsx`, `src/utils/notationMath.ts`, `src/utils/scaleSpeller.ts`
* **Current State:** Split keyboard, settings header, and middle card panels are implemented.
* **The Goal:** Working notation visualizer showing staff notes of the active scale with last-played highlight, and a bottom range filter keyboard depicting output pitches.

## 2. Technical Decisions & Dependencies
* **Staff Notation Mapping:**
  * Uses Bravura font glyphs for treble clef (`\uE050`) and noteheads (`\uE0A4`).
  * `useEffect` dependency on `activeState.lastPlayedMidi` in Zustand to color/highlight the corresponding note on the staff.
* **Output Keyboard Mapping:**
  * Map slider values to standard note names (e.g. `21` -> `A0`, `108` -> `C8`) instead of index values.
  * Restrict settings menu solely to "Octave Wrap" and "Smart Wrap" filter modes.
  * Receive final processed output notes from state store and visually depress them.

## 3. Task List
### Stage 1: Implement Scale Inspector Notation
* **Objective:** Port notation rendering logic.
* **Tasks:**
    1. Create/refactor `src/utils/notationMath.ts` and `src/utils/scaleSpeller.ts` to calculate staff step offsets and accidentals from scale spelling intervals.
    2. Create `src/components/ScaleInspectorNotation.tsx` using HTML Canvas or absolute elements. Highlight the last played note.

### Stage 2: Implement Note Range Filter Keyboard
* **Objective:** Refactor range filter UI.
* **Tasks:**
    1. Create `src/components/NoteRangeFilterKeyboard.tsx`. Expose min/max slider handles.
    2. Map the numeric thumb tooltips to note strings (e.g. `midiNoteToName(value)`).
    3. Expose only "Octave Wrap" and "Smart Wrap" options in the toggle menus.
    4. Highlight/depress keys corresponding to target output midi notes.
* **TDD Checkpoint:** > **AGENT INSTRUCTION:** Write `src/components/NoteRangeFilterKeyboard.test.tsx` to assert that note range tooltips render as string note names (e.g., 'C4' instead of '60'). Run `npx vitest run NoteRangeFilterKeyboard.test.tsx`.

## 4. Final Review & Cleanup
* **Verification:** Verify that dragging the range slider properly restricts output boundaries.
