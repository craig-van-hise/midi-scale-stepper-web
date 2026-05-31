# WORK ORDER: 2-7_core-algorithm
**Status:** ✅ Completed
**Description:** Implement the pure logical modules for pitch-class bitmask generation, rounding to scale boundaries, and voice-leading scale transitions.

### **ID Composition**
> **Format:** `{Batch}-{Track Number}_{Persona ID}`
* **`2` (Batch):** The synchronous deployment phase.
* **`7` (Track Number):** The agent’s fixed vertical placement (1-15).
* **`core-algorithm`:** The unique functional identifier using kebab-case.
* **Note on Status Icons:** 🔘 Pending | 🔵 Active | ✅ Completed | 🚨 Error | ❌ Canceled

## Agent Invocation
* **Agent Role:** ~/.gemini/agents/core-algorithm.md

## 1. Project Context & Objectives
* **Working Directory:** `/Users/vv2024/Documents/Repos - vv2024/MIDI/WebApps/midi-scale-stepper`
* **Files in Scope:** `src/utils/BitmaskCalculator.ts`, `src/utils/RoundingEngine.ts`, `src/utils/ScaleTransitionEngine.ts`
* **Current State:** State store is configured, LUT data is loaded.
* **The Goal:** Headless logic files implemented strictly matching the mathematical descriptions of Algorithms 1, 2, and 3.

## 2. Technical Decisions & Dependencies
* **Logic Pre-Computation:**
  * **Algorithm 1 (Bitmask & Decimal):**
    1. Extract pitches $N$.
    2. $bass\_note = \min(N) \implies bass\_pc = bass\_note \pmod{12}$.
    3. $normalized\_pc = (n \pmod{12} - bass\_pc + 12) \pmod{12}$.
    4. Create 12-bit binary string: index $i$ is `1` if $i \in normalized\_pcs$, else `0`. (Index 0 is the left-most bit).
    5. Reverse the 12-bit string, convert to base-10 decimal. (e.g. Major Triad [C, E, G] = [0, 4, 7] -> Bitmask `100010010000` -> Reversed: `000010010001` -> Decimal `145`).
  * **Algorithm 2 (Out-of-Scale Rounding):**
    * Target step note $T \implies P_{target} = T \pmod{12}$.
    * If $P_{target} \notin scale$, increment/decrement pitch class by 1 until it matches.
    * If wrap past 11 (when rounding up), octave increments by 1. If wrap below 0 (when rounding down), octave decrements by 1.
  * **Algorithm 3 (Transition & Voice-Leading):**
    * If `lastPlayedMidi` pitch class exists in the new scale, output matches.
    * If not, apply Algorithm 2 to snap it to the nearest valid note.

## 3. Task List
### Stage 1: Implement Bitmask & Decimal Conversion
* **Objective:** Code the pitch normalization and bitmask parser.
* **Tasks:**
    1. Create `src/utils/BitmaskCalculator.ts` exporting `calculateBitmaskDecimal(midiNotes: number[]): number`.
    2. Write calculations following Algorithm 1. Ensure empty arrays return 0.

### Stage 2: Implement Rounding & Transition Engines
* **Objective:** Implement rounding boundaries and scale-change voice-leading.
* **Tasks:**
    1. Create `src/utils/RoundingEngine.ts` exporting `roundToScale(note: number, scalePitchClasses: number[], preference: 'UP' | 'DOWN'): number`. Implement Algorithm 2.
    2. Create `src/utils/ScaleTransitionEngine.ts` exporting `handleScaleTransition(lastPlayedMidi: number, newScalePitchClasses: number[], preference: 'UP' | 'DOWN'): number`. Implement Algorithm 3.
* **TDD Checkpoint:** > **AGENT INSTRUCTION:** Verify compilation is error-free. (Full testing is detailed in Work Order 2-10).

## 4. Final Review & Cleanup
* **Verification:** Ensure modularity and zero dependency on React state.
