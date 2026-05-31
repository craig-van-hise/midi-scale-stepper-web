# WORK ORDER: 4-13_ui-coder
**Status:** ✅ Completed
**Description:** Implement the Input Keyboard showing the 4 hardcoded MIDI split zones (Root Select, Scale Select, Stepper, Thru) and binding key depressions to Zustand state.

### **ID Composition**
> **Format:** `{Batch}-{Track Number}_{Persona ID}`
* **`4` (Batch):** The synchronous deployment phase.
* **`13` (Track Number):** The agent’s fixed vertical placement (1-15).
* **`ui-coder`:** The unique functional identifier using kebab-case.
* **Note on Status Icons:** 🔘 Pending | 🔵 Active | ✅ Completed | 🚨 Error | ❌ Canceled

## Agent Invocation
* **Agent Role:** ~/.gemini/agents/ui-coder.md

## 1. Project Context & Objectives
* **Working Directory:** `/Users/vv2024/Documents/Repos - vv2024/MIDI/WebApps/midi-scale-stepper`
* **Files in Scope:** `src/components/KeySplitKeyboard.tsx`, `src/utils/keyboardMap.ts`
* **Current State:** Header, state store, and algorithms are complete.
* **The Goal:** An input keyboard displaying note ranges with visual split indicators and highlighting currently active keys based on `uiState.activeKeys`.

## 2. Technical Decisions & Dependencies
* **Split Definitions:**
  * **Root Select (Orange):** MIDI notes 36 to 47 (C2-B2). Pressing keys here sets `activeState.rootNote` in the store.
  * **Scale Select (Yellow):** MIDI notes 48 to 59 (C3-B3).
  * **Stepper (Blue):** MIDI notes 60 to 84 (C4-C6).
  * **Thru (Slate Grey):** MIDI notes `< 36` and `> 84`.
* **State Updates:**
  * Web MIDI event hooks (from Phase 1) update the Zustand store `uiState.activeKeys`.
  * The Input Keyboard reads `uiState.activeKeys` and visually depresses the corresponding key.

## 3. Task List
### Stage 1: Copy/Create Keyboard Files
* **Objective:** Scaffold the keyboard component and mappings.
* **Tasks:**
    1. Create `src/utils/keyboardMap.ts` containing arrays of white and black key coordinates and properties.
    2. Create `src/components/KeySplitKeyboard.tsx` as a functional component.
    3. Render the keys (e.g. from MIDI notes 21 to 108, or 36 to 96, fitting the split zones). Make sure the keys are colored at the top with their zone colors (Orange for Root, Yellow for Scale, Blue for Stepper, Slate for Thru).

### Stage 2: Bind Touch Actions and State
* **Objective:** Allow mouse clicks on the keys to mock MIDI input.
* **Tasks:**
    1. Clicking/depressing a key updates `uiState.activeKeys`.
    2. If a key is in the Root Select zone (36-47), update `activeState.rootNote = midiNote % 12`.
* **TDD Checkpoint:** > **AGENT INSTRUCTION:** Write `src/components/KeySplitKeyboard.test.tsx` to assert that playing MIDI note 36 sets rootNote to 0 (C) and adds 36 to activeKeys. Run `npx vitest run KeySplitKeyboard.test.tsx`.

## 4. Final Review & Cleanup
* **Verification:** Confirm zone colors match the specification: Orange, Yellow, Blue, and Slate Grey.
