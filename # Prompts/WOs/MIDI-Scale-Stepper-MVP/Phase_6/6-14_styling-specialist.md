# WORK ORDER: 6-14_styling-specialist
**Status:** 🔘 Pending
**Description:** Style the staff and range keyboard, ensuring optimal layout and alignment.

### **ID Composition**
> **Format:** `{Batch}-{Track Number}_{Persona ID}`
* **`6` (Batch):** The synchronous deployment phase.
* **`14` (Track Number):** The agent’s fixed vertical placement (1-15).
* **`styling-specialist`:** The unique functional identifier using kebab-case.
* **Note on Status Icons:** 🔘 Pending | 🔵 Active | ✅ Completed | 🚨 Error | ❌ Canceled

## Agent Invocation
* **Agent Role:** ~/.gemini/agents/styling-specialist.md

## 1. Project Context & Objectives
* **Working Directory:** `/Users/vv2024/Documents/Repos - vv2024/MIDI/WebApps/midi-scale-stepper`
* **Files in Scope:** `src/index.css`, styling files, fonts configurations.
* **Current State:** Coded components exist from Work Order 6-13.
* **The Goal:** Premium styling for staff canvas and bottom keyboard. Correct fonts, shadows, borders, active indicators, and slide animations.

## 2. Technical Decisions & Dependencies
* **Font face integration:** Ensure Bravura font loads via `@font-face` declaration in `src/index.css`.
* **Theme Styling:** Enforce high-level light theme parameters. Background should remain white/light. Accent notehead highlight colors should pop without causing clutter.

## 3. Task List
### Stage 1: Font Face and Staff Layout
* **Objective:** Ensure Bravura font works and staff is visually centered.
* **Tasks:**
    1. Add the Bravura `@font-face` configuration in `src/index.css`. Set up local file paths correctly.
    2. Style notation canvas wrapper: white background, thin borders, centered layouts.

### Stage 2: Output Keyboard Layout
* **Objective:** Style range sliders and piano.
* **Tasks:**
    1. Align range slider thumbs exactly over the piano key centers.
    2. Style hover tooltips and drag handles.
* **TDD Checkpoint:** > **AGENT INSTRUCTION:** Run the dev server `npm run dev` and verify visually that treble clef loads correctly and ledger lines align.

## 4. Final Review & Cleanup
* **Verification:** Assert that Bravura font doesn't fall back to standard serif.
