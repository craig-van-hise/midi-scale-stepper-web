# WORK ORDER: 3-13_ui-coder
**Status:** ✅ Completed
**Description:** Build the Global Header controls, settings dialog, info modal, and panic routing UI.

### **ID Composition**
> **Format:** `{Batch}-{Track Number}_{Persona ID}`
* **`3` (Batch):** The synchronous deployment phase.
* **`13` (Track Number):** The agent’s fixed vertical placement (1-15).
* **`ui-coder`:** The unique functional identifier using kebab-case.
* **Note on Status Icons:** 🔘 Pending | 🔵 Active | ✅ Completed | 🚨 Error | ❌ Canceled

## Agent Invocation
* **Agent Role:** ~/.gemini/agents/ui-coder.md

## 1. Project Context & Objectives
* **Working Directory:** `/Users/vv2024/Documents/Repos - vv2024/MIDI/WebApps/midi-scale-stepper`
* **Files in Scope:** `src/components/Header.tsx`, `src/components/SettingsModal.tsx`, `src/components/InfoModal.tsx`, `src/App.tsx`
* **Current State:** Setup and algorithm engines complete.
* **The Goal:** A responsive top header containing App Title, Web MIDI Port Selectors, Power/Bypass button, Panic button, Info button, and Settings button. Settings and Info buttons open their respective modal overlays.

## 2. Technical Decisions & Dependencies
* **Component Routing & State:**
  * Power/Bypass: Toggles `globalSettings.power` (green when true, grey when false).
  * Panic: Resets active keys array and clears last played note.
  * Settings Cog: Exposes dropdowns/inputs for Channel Filter (1-16 or 'ALL'), Starting Octave (0-7), and Rounding Preference (UP/DOWN).
  * Info "i": Static details (Craig Van Hise, links to virtualvirgin.net and GitHub).
  * Use Lucide icons (`Power`, `AlertOctagon` or `Radio`, `Info`, `Settings`, `Play`).

## 3. Task List
### Stage 1: Build Header Shell and Buttons
* **Objective:** Code the top navbar.
* **Tasks:**
    1. Create `src/components/Header.tsx`. Layout using Flexbox. Left side: Title, Web MIDI input port selector. Right side: Power toggle, Panic, Info, Settings buttons.
    2. Wire buttons to update Zustand store state.

### Stage 2: Modals Integration
* **Objective:** Implement Settings and Info modal views.
* **Tasks:**
    1. Create `src/components/SettingsModal.tsx` displaying inputs for Channel Filter, Starting Octave, and Round Preference toggle. Expose standard HTML modal element (`<dialog>` or portal).
    2. Create `src/components/InfoModal.tsx` showing the MVP product credits.
    3. Import all into `src/App.tsx` and verify layout.
* **TDD Checkpoint:** > **AGENT INSTRUCTION:** Write a vitest component test `src/components/Header.test.tsx` to assert that clicking the Panic button invokes the store cleanups. Run `npx vitest run Header.test.tsx`.

## 4. Final Review & Cleanup
* **Verification:** Assure HTML elements use unique, descriptive IDs to facilitate QA checking.
