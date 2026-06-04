# Fonts Used in MIDI Scale Stepper UI

This document lists all of the typography and font families used in the MIDI Scale Stepper web application, including their sources, classifications, and roles within the user interface.

---

## 1. Outfit (Google Fonts)
* **Source:** Google Fonts (Imported via [index.html](file:///Users/vv2024/Documents/Repos%20-%20vv2024/MIDI/WebApps/midi-scale-stepper/index.html))
* **Classification:** Sans-serif / Geometric Display
* **CSS Variable:** `--font-display: 'Outfit', sans-serif;` (Defined in [src/index.css](file:///Users/vv2024/Documents/Repos%20-%20vv2024/MIDI/WebApps/midi-scale-stepper/src/index.css))
* **Usage & Purpose:**
  * **App Title:** Used for the main header title `"MIDI Scale Stepper"` in [Header.tsx](file:///Users/vv2024/Documents/Repos%20-%20vv2024/MIDI/WebApps/midi-scale-stepper/src/components/Header.tsx#L21) (`font-display`).
  * **Modal Titles:** Used for section/header titles inside settings and information modals (e.g., `h2` elements in `SettingsModal.tsx`, `InfoModal.tsx`, and `PlayStartSettingsModal.tsx`).
  * Provides a geometric, premium header look.

## 2. Inter (Google Fonts)
* **Source:** Google Fonts (Imported via [index.html](file:///Users/vv2024/Documents/Repos%20-%20vv2024/MIDI/WebApps/midi-scale-stepper/index.html))
* **Classification:** Sans-serif
* **CSS Variable:** `--font-sans: 'Inter', sans-serif;` (Defined in [src/index.css](file:///Users/vv2024/Documents/Repos%20-%20vv2024/MIDI/WebApps/midi-scale-stepper/src/index.css))
* **Usage & Purpose:**
  * **Global Body & controls:** Used as the default sans-serif font applied to the HTML `body` for settings selectors, buttons, context menus, and general label descriptions.

## 3. Bravura (SMuFL Music Notation Font)
* **Source:** Local Web Font (Loaded via `/fonts/Bravura.woff2` in [src/index.css](file:///Users/vv2024/Documents/Repos%20-%20vv2024/MIDI/WebApps/midi-scale-stepper/src/index.css))
* **Classification:** Standard Music Font Layout (SMuFL)
* **CSS Class:** `.smufl`
* **Usage & Purpose:**
  * **Music Notation Elements:** Used in [ScaleInspectorNotation.tsx](file:///Users/vv2024/Documents/Repos%20-%20vv2024/MIDI/WebApps/midi-scale-stepper/src/components/ScaleInspectorNotation.tsx) to render music symbols (Treble clef, accidentals, and noteheads) inside the musical staff container.

## 4. Roboto Mono & generic 'monospace' (Monospace Stack)
* **Source:** System monospace fallback & Google Fonts style structure
* **Classification:** Monospace
* **Usage & Purpose:**
  * **Key Switch Labels:** Used in [ScaleStepperKeySwitches24.tsx](file:///Users/vv2024/Documents/Repos%20-%20vv2024/MIDI/WebApps/midi-scale-stepper/src/components/ScaleStepperKeySwitches24.tsx#L88) (`'Roboto Mono', monospace`) for step values and the active offset label strip to prevent layout shifts when the values change dynamically.
  * **Notation Intervals:** Used in [ScaleInspectorNotation.tsx](file:///Users/vv2024/Documents/Repos%20-%20vv2024/MIDI/WebApps/midi-scale-stepper/src/components/ScaleInspectorNotation.tsx#L574) (`fontFamily: 'monospace'`) to label scale intervals (e.g., `1`, `b3`, `5`) above each notehead on the staff.

## 5. Generic 'sans-serif' (System / Browser Fallback Stack)
* **Source:** System / Browser default sans-serif (e.g., Helvetica/Arial/San Francisco)
* **Classification:** Sans-serif
* **Usage & Purpose:**
  * **Notation Non-Music Labels:** Used in [ScaleInspectorNotation.tsx](file:///Users/vv2024/Documents/Repos%20-%20vv2024/MIDI/WebApps/midi-scale-stepper/src/components/ScaleInspectorNotation.tsx#L419) (`fontFamily: 'sans-serif'`) for the **scale name header** (e.g. `"C Major"`) and the **individual note spelling labels** (e.g. `"C4"`, `"D4"`) positioned underneath the staff.
