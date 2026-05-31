# WORK ORDER: 3-14_styling-specialist
**Status:** ✅ Completed
**Description:** Style the header and modals, enforcing light-theme visual rules and clean alignment.

### **ID Composition**
> **Format:** `{Batch}-{Track Number}_{Persona ID}`
* **`3` (Batch):** The synchronous deployment phase.
* **`14` (Track Number):** The agent’s fixed vertical placement (1-15).
* **`styling-specialist`:** The unique functional identifier using kebab-case.
* **Note on Status Icons:** 🔘 Pending | 🔵 Active | ✅ Completed | 🚨 Error | ❌ Canceled

## Agent Invocation
* **Agent Role:** ~/.gemini/agents/styling-specialist.md

## 1. Project Context & Objectives
* **Working Directory:** `/Users/vv2024/Documents/Repos - vv2024/MIDI/WebApps/midi-scale-stepper`
* **Files in Scope:** `src/index.css`, `src/App.tsx`, styling configurations.
* **Current State:** Header and Modals coded in Work Order 3-13.
* **The Goal:** A premium light-themed UI matching the specifications (white cards, clean shadows, sans-serif typography, green-tinted active power, amber/orange warnings).

## 2. Technical Decisions & Dependencies
* **Theme & Color Constraints:**
  * Background: Slate-50 or neutral light.
  * Cards: Plain White (`bg-white`), subtle shadow (`shadow-sm` or `shadow-md`), rounded corners.
  * Typography: Inter or Outfit font (sans-serif), medium font weights, clean spacing.
  * Active/Power State: Tailwind `text-emerald-600` / `bg-emerald-50` when active.
  * Modals: Backdrop blur overlay (`backdrop-blur-sm bg-black/30`), white card popup.

## 3. Task List
### Stage 1: Styles Setup and Fonts
* **Objective:** Polish the index.css and font imports.
* **Tasks:**
    1. Import Google Fonts (Inter/Outfit) via CSS or HTML header.
    2. Define root utility custom properties in `src/index.css` if necessary, and style generic scrollbars/focus states.

### Stage 2: Components Review and Styling
* **Objective:** Refine Header and Modal stylings.
* **Tasks:**
    1. Polish Header layouts (grid alignments, button spacing, active outlines).
    2. Style Modals (transitions, centering, input fields, close buttons).
* **TDD Checkpoint:** > **AGENT INSTRUCTION:** Run the Vite development server `npm run dev` and visually verify that modals center properly and active states light up.

## 4. Final Review & Cleanup
* **Verification:** Verify that there is zero layout shifting or overlapping when responsive heights change.
