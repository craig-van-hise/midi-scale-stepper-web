# WORK ORDER: 5-13_ui-coder
**Status:** ✅ Completed
**Description:** Implement the side-by-side Middle Card layout containing the 12-scale keyswitches and the 25-key additive stepper switches.

### **ID Composition**
> **Format:** `{Batch}-{Track Number}_{Persona ID}`
* **`5` (Batch):** The synchronous deployment phase.
* **`13` (Track Number):** The agent’s fixed vertical placement (1-15).
* **`ui-coder`:** The unique functional identifier using kebab-case.
* **Note on Status Icons:** 🔘 Pending | 🔵 Active | ✅ Completed | 🚨 Error | ❌ Canceled

## Agent Invocation
* **Agent Role:** ~/.gemini/agents/ui-coder.md

## 1. Project Context & Objectives
* **Working Directory:** `/Users/vv2024/Documents/Repos - vv2024/MIDI/WebApps/midi-scale-stepper`
* **Files in Scope:** `src/components/MiddleContainer.tsx`, `src/components/ScaleKeySwitches12.tsx`, `src/components/ScaleStepperKeySwitches25.tsx`
* **Current State:** Input keyboard splits and state store are active.
* **The Goal:** A container card containing:
  - Left: 12-key switch keyboard where the dropdown lists exactly the 10 MVP scales.
  - Right: 25-key switch keyboard with keys displaying static indices from `-12` to `+12` (center: `0`).

## 2. Technical Decisions & Dependencies
* **10 Scale Roster (and their respective PCS_LUT bitmask indices):**
  * Major, Melodic Minor, Harmonic Minor, Harmonic Major, Major Pentatonic, Minor Pentatonic, Augmented, Whole Tone, Diminished, Chromatic.
  * Selection updates `activeState.scaleDecimalId` in Zustand.
* **25 Key Index Labels:**
  * Chronologically mapped semitones C4 to C6 correspond to indexes `-12` (C4) up to `+12` (C6), with center `0` at C5.
  * Strip out all interval/text fields from the keys; print only the static index value.

## 3. Task List
### Stage 1: Implement KeySwitches Container
* **Objective:** Code the side-by-side flex/grid wrapper.
* **Tasks:**
    1. Create `src/components/MiddleContainer.tsx`. Set up a grid or flex row with white background card styling, thin border, and modern spacing.
    2. Import both keyboard controls inside.

### Stage 2: Refactor Keyboards
* **Objective:** Customize the two keyboard components for the scale stepper.
* **Tasks:**
    1. Create/refactor `src/components/ScaleKeySwitches12.tsx` to bind the 10 scales to Zustand scale state.
    2. Create/refactor `src/components/ScaleStepperKeySwitches25.tsx` to display static indices from `-12` to `+12` (C5 = 0).
* **TDD Checkpoint:** > **AGENT INSTRUCTION:** Write `src/components/ScaleStepperKeySwitches25.test.tsx` to assert that 25 keys render with static indices `-12` to `+12`. Run `npx vitest run ScaleStepperKeySwitches25.test.tsx`.

## 4. Final Review & Cleanup
* **Verification:** Confirm dropdown limits options to only the 10 MVP scales.
