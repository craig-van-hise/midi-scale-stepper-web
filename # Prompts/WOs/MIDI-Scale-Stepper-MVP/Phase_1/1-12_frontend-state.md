# WORK ORDER: 1-12_frontend-state
**Status:** ✅ Completed
**Description:** Implement the Zustand global store state and Web MIDI Hook to process incoming MIDI events into state.

### **ID Composition**
> **Format:** `{Batch}-{Track Number}_{Persona ID}`
* **`1` (Batch):** The synchronous deployment phase.
* **`12` (Track Number):** The agent’s fixed vertical placement (1-15).
* **`frontend-state`:** The unique functional identifier using kebab-case.
* **Note on Status Icons:** 🔘 Pending | 🔵 Active | ✅ Completed | 🚨 Error | ❌ Canceled

## Agent Invocation
* **Agent Role:** ~/.gemini/agents/frontend-state.md

## 1. Project Context & Objectives
* **Working Directory:** `/Users/vv2024/Documents/Repos - vv2024/MIDI/WebApps/midi-scale-stepper`
* **Files in Scope:** `src/store/useMidiStore.ts`, `src/hooks/useWebMidi.ts`, `src/utils/binaryLut.ts`, `public/PCS_LUT.dat`, `src/types/midi.ts`
* **Current State:** Workspace scaffolding complete (from Work Order 1-1).
* **The Goal:** A functional Zustand store and hook that successfully captures MIDI note-on and note-off events, updates `uiState.activeKeys`, and loads the `PCS_LUT.dat` database.

## 2. Technical Decisions & Dependencies
* **Architectural Mandates:**
  * Zustand store matching the exact schema in the PDD (globalSettings, activeState, uiState).
  * Web MIDI hook using native navigator.requestMIDIAccess.
  * Load `PCS_LUT.dat` via binary parser (can be adapted from `react-midi-components/src/utils/binaryLut.ts`).

## 3. Task List
### Stage 1: Zustand Store and Types
* **Objective:** Define store state and actions.
* **Tasks:**
    1. Define TypeScript interfaces for `MidiState` in `src/types/midi.ts`.
    2. Create `src/store/useMidiStore.ts` using Zustand. Include actions to add/remove active keys, update settings, and set root/scale notes.
    3. Copy `PCS_LUT.dat` from `/Users/vv2024/Documents/Repos - vv2024/MIDI/react-midi-components/public/PCS_LUT.dat` to `public/PCS_LUT.dat`.
    4. Copy and adapt `binaryLut.ts` into `src/utils/binaryLut.ts`.

### Stage 2: Web MIDI Hook
* **Objective:** Capture browser Web MIDI events.
* **Tasks:**
    1. Create `src/hooks/useWebMidi.ts`. It should call `requestMIDIAccess` and listen to MIDI messages.
    2. Map Note On (status `0x90` or `144` with velocity > 0) to add keys to `uiState.activeKeys`, and Note Off (status `0x80` or `128`, or Note On with velocity 0) to remove keys.
* **TDD Checkpoint:** > **AGENT INSTRUCTION:** Write a vitest test file `src/store/useMidiStore.test.ts` to assert that playing notes adds and removes them from the Zustand store. Run `npx vitest run` to verify.

## 4. Final Review & Cleanup
* **Verification:** Assert the store matches the exact interface specified in the PDD.
