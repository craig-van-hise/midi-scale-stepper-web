
# Product Requirements Document (PRD): MIDI Scale Stepper (MVP)

## 1. Product Overview

**1.1 Description**
The MIDI Scale Stepper is a WebApp designed to allow musicians to play through musical scales by stepping through them using intervals mapped to specific MIDI key switches. The interface centers on displaying the selected scale in standard notation while providing robust input and output visualizers to track the mapping logic.

**1.2 MVP Scope**
The MVP phase focuses exclusively on the visual, logical, and routing mechanisms of the stepping architecture. Audio generation (synthesis) and external MIDI data output are out of scope for this phase. The Output Keyboard will serve as a visual validator for the mathematical logic before future ROMPLER integration.

---

## 2. Core Mechanics & Mathematical Logic

**2.1 Additive Stepping**
Step action is additive and acts as an index increment/decrement from a designated root or unison point. Pushing a `+1` key switch advances the output note to the next available note in the active scale.

**2.2 Out-of-Scale Handling (Rounding Algorithm)**
Because scales possess varying cardinalities (e.g., 7-note diatonic vs. 5-note pentatonic), strict generalized intervals (like a "major 2nd") do not neatly map to step increments.
The system will use a global mathematical ceiling/floor mechanism to snap "out of scale" chromatic steps into the active scale.

* **Global Preference:** The user will have a binary choice in the global settings: **Round Up (Default)** or **Round Down**.
* **Behavior:** If a triggered step lands on a pitch class outside the active scale, the app applies the rounding preference to snap the note to the nearest allowed pitch class.

*Example Matrix: C Chromatic Input stepping into C Major Pentatonic (Default: Round Up)*

| Chromatic Input | Pentatonic Output | Action Triggered |
| --- | --- | --- |
| **C** | **C** | *Already in scale* |
| C# | D | Rounds up |
| **D** | **D** | *Already in scale* |
| D# | E | Rounds up |
| **E** | **E** | *Already in scale* |
| F | G | Rounds up |
| F# | G | Rounds up |
| **G** | **G** | *Already in scale* |
| G# | A | Rounds up |
| **A** | **A** | *Already in scale* |
| A# | C | Rounds up (Next Octave) |
| B | C | Rounds up (Next Octave) |

**2.3 Scale Transition & Voice-Leading Constraints**
When a user switches the active scale mid-performance, the application will attempt to maintain the exact pitch class letter of the currently held/last played note (e.g., C4 in C Major becomes C#4 in A Major).

* **Edge Case Fallback:** If the exact pitch class does not exist in the newly selected scale (e.g., E5 in C Major transitioning to Eb Minor Pentatonic), the system will fallback to the user's global rounding preference (Up/Down) to snap to the nearest valid note in the new scale before applying the next step.

---

## 3. Data Architecture & Lookup Logic

**3.1 The PCS Look-Up Table (`PCS_LUT.dat`)**
Scale interval arrays (e.g., `["1", "b2", "b3", "4", "5", "b6", "b7"]`) will be retrieved from the existing `PCS_LUT.dat` using the `"scale_intervals"` key. All entries are `0`-normalized based on the lowest note (the root).

**3.2 MIDI Selection Algorithm (Key Generation)**
To translate active MIDI input into the correct index key for the `PCS_LUT`, the application will execute the following pipeline:

1. **Identify Pitch Set:** Capture all active MIDI note numbers.
2. **Determine Bass Note:** `bass_note = min(midi_notes)` -> `bass_pc = bass_note % 12`.
3. **Reduce & Normalize:** Extract unique pitch classes and transpose them so the bass pitch class is `0` (ensuring inversions generate unique decimals).
* `normalized_pc = (pc - bass_pc + 12) % 12`


4. **Bitmask Conversion:** Sum the powers of 2 for each normalized pitch class:
* `decimal = sum(2^pc for pc in normalized_pcs)`


5. **String Parsing:** When reading the 12-bit string from the JSON, the application must **reflect (reverse)** the bit order before converting to a decimal value.

---

## 4. User Interface Layout & Hierarchy

**Theme constraints:** Light theme, white cards, white background. Do not add instructional text beyond the specified UI elements.

### 4.1 Title Bar Header (Global Controls)

* **Left:** Application Title ("MIDI Scale Stepper"), Presets Dropdown, MIDI IN port dropdown.
* **Right (Buttons):** * **Power/Bypass:** Toggles green when active. True bypass for the effect.
* **Panic ("!"):** Sends MIDI note-off messages to all channels/ports.
* **Info ("i"):** Opens modal (Product Name, Author "Craig Van Hise", short description, links to virtualvirgin.net and GitHub).
* **Settings (Cog):** Opens modal containing: MIDI Channel Filter, Starting Octave (Range 0-7), and Global Rounding Preference (Round Up / Round Down).



### 4.2 Input Keyboard (Top Card)

Standard MIDI keyboard view segmented into colored key splits:

* **Root Select (Orange):** C2-B2 (1 Octave). 1:1 mapping; defines the scale root.
* **Scale Select (Yellow):** C3-B3 (1 Octave). Key switches mapped to specific scales.
* **Stepper (Blue):** C4-C6 (2 Octaves). Additive step triggers.
* **Thru (Slate Grey):** All remaining keys below C2 and above C6.

### 4.3 KeySwitch Keyboards (Middle Card Container)

A dedicated container holding two "fat" keyboards side-by-side to display specialized function states.

* **Left: Scale Select (12 Keys):** * Uses an internal dropdown UI to assign scales.
* *MVP Scale Roster:* Major, Melodic Minor, Harmonic Minor, Harmonic Major, Major Pentatonic, Minor Pentatonic, Augmented, Whole Tone, Diminished, Chromatic.


* **Right: Stepper (25 Keys):** * Displays static index addition labels only (e.g., `0`, `+1`, `-1`, `+2`).

### 4.4 Scale Notation (Lower-Middle Card)

* Displays a single bar of standard music notation depicting the active scale based on spelling from the `PCS_LUT`.
* Highlights the *last played* note (does not predict the next note).

### 4.5 Output Keyboard (Bottom Card)

* Visually outputs the results of the stepping algorithm.
* Range slider handles must use standard note names (e.g., C1, C8).
* Component settings restricted to "Octave Wrap" and "Smart Wrap" filter modes.

---

## 5. Component Adaptations (Engineering Specs)

Development will utilize existing React components. The table below details source locations and required MVP modifications.

| Component Name | Source Path | Required MVP Modifications |
| --- | --- | --- |
| **Input Keyboard** | `.../plugins/midi-transposer/components/KeySplitKeyboard.jsx` & `keyboardMap.js` | Update key mapping to establish the four specific zones (Orange C2-B2, Yellow C3-B3, Blue C4-C6, Grey Thru). |
| **KeySwitches Container** | *N/A (New UI Wrapper needed)* | Create a side-by-side layout card to house both the Scale Select and Stepper components below. |
| **Scale Select** | `.../react-midi-components/src/components/keyboards/ScaleKeySwitches12.tsx` | Restrict internal dropdown list exclusively to the 10 scales defined in Section 4.3. |
| **Stepper** | `.../react-midi-components/src/components/keyboards/ScaleStepperKeySwitches25.tsx` | Remove dynamic "next interval" text. Retain static index labels at the bottom of the keys (`0`, `+1`, etc.). |
| **Scale Notation** | `.../react-midi-components/src/components/notation/ScaleInspectorNotation.tsx` | Use as-is. Ensure it receives state updates to highlight the last played note. |
| **Output Keyboard** | `.../plugins/midi-transposer/components/NoteRangeFilterKeyboard.jsx` | 1. Update range sliders to note names.<br>

<br>2. Restrict internal settings menu to "Octave Wrap" and "Smart Wrap" only. |