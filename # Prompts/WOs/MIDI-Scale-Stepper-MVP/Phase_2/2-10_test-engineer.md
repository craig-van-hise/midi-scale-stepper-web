# WORK ORDER: 2-10_test-engineer
**Status:** ✅ Completed
**Description:** Implement comprehensive Vitest unit tests verifying the correctness of all three core logical algorithms.

### **ID Composition**
> **Format:** `{Batch}-{Track Number}_{Persona ID}`
* **`2` (Batch):** The synchronous deployment phase.
* **`10` (Track Number):** The agent’s fixed vertical placement (1-15).
* **`test-engineer`:** The unique functional identifier using kebab-case.
* **Note on Status Icons:** 🔘 Pending | 🔵 Active | ✅ Completed | 🚨 Error | ❌ Canceled

## Agent Invocation
* **Agent Role:** ~/.gemini/agents/test-engineer.md

## 1. Project Context & Objectives
* **Working Directory:** `/Users/vv2024/Documents/Repos - vv2024/MIDI/WebApps/midi-scale-stepper`
* **Files in Scope:** `src/utils/BitmaskCalculator.test.ts`, `src/utils/RoundingEngine.test.ts`, `src/utils/ScaleTransitionEngine.test.ts`
* **Current State:** Algorithms are written in Work Order 2-7.
* **The Goal:** A test suite that exercises all boundary conditions, proving mathematical accuracy of the routing layers.

## 2. Technical Decisions & Dependencies
* **Testing Requirements:**
  * Vitest framework.
  * Major Triad mapping must resolve to `145` (e.g., C4, E4, G4).
  * Out-of-Scale rounding must adjust octaves when wrapping around C (MIDI Pitch % 12 == 0 boundary).

## 3. Task List
### Stage 1: Write Tests for Engines
* **Objective:** Code test cases covering edge and happy paths.
* **Tasks:**
    1. Create `src/utils/BitmaskCalculator.test.ts`. Test note sets: Major Triad (`[60, 64, 67]` -> `145`), Minor Triad (`[60, 63, 67]` -> `273`), Chromatic pitches.
    2. Create `src/utils/RoundingEngine.test.ts`. Test rounding up of D# (63) in C Pentatonic (`[0, 2, 4, 7, 9]`) -> E (64). Test rounding B (71) up -> C (72) (octave wrap). Test rounding down.
    3. Create `src/utils/ScaleTransitionEngine.test.ts`. Test voice leading transitions, retaining pitch if in scale, snapped note if not.
* **TDD Checkpoint:** > **AGENT INSTRUCTION:** Run `npx vitest run src/utils/` to ensure all tests pass. Do not proceed until tests are a strict **PASS**.

## 4. Final Review & Cleanup
* **Verification:** Confirm zero failures and clean console logs.
