import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import KeySplitKeyboard from './KeySplitKeyboard';
import { useMidiStore } from '../store/useMidiStore';

describe('KeySplitKeyboard Zone Routing', () => {
  beforeEach(() => {
    useMidiStore.getState().panic();
    useMidiStore.setState({
      activeState: {
        rootNote: null,
        scaleDecimalId: null,
        lastPlayedMidi: null,
        keySwitches: [
          { root: 'C', type: 'Major' },
          { root: 'C#', type: 'Dorian' },
        ],
        selectedScaleIndex: 0,
        activeSwitchIndex: 0,
      },
      uiState: {
        ...useMidiStore.getState().uiState,
        activeKeys: [],
        outputActiveKeys: [],
      },
    });
  });

  it('sets rootNote to 0 when MIDI 24 (C1) key is clicked (Root Select split)', () => {
    const { container } = render(<KeySplitKeyboard />);
    const key = container.querySelector('#pksplit-24');
    expect(key).toBeDefined();

    if (key) {
      fireEvent.mouseDown(key);
    }

    expect(useMidiStore.getState().activeState.rootNote).toBe(0);
  });

  it('sets scale index when MIDI 37 (C#2) key is clicked (Scale Select split)', () => {
    const { container } = render(<KeySplitKeyboard />);
    const key = container.querySelector('#pksplit-37');
    expect(key).toBeDefined();

    if (key) {
      fireEvent.mouseDown(key);
    }

    expect(useMidiStore.getState().activeState.activeSwitchIndex).toBe(1);
    expect(useMidiStore.getState().activeState.rootNote).toBe(1); // Dorian root C#
  });

  it('Phase 1 UI Check: wraps Play/Start zone clicked keys when filter mode is smart_wrap', () => {
    useMidiStore.setState({
      globalSettings: {
        midiInPort: null,
        power: true,
        channelFilter: 'ALL',
        startOctave: 4,
        roundPreference: 'UP',
        filterMode: 'smart_wrap',
        filterRange: [36, 83],
        inputKeyboardSize: 88,
      },
      playStartSettings: {
        rounded: false,
        audible: true,
        octaveOffset: 0,
      },
    });

    const { container } = render(<KeySplitKeyboard />);
    const key = container.querySelector('#pksplit-84'); // C6
    expect(key).toBeDefined();

    if (key) {
      fireEvent.mouseDown(key);
    }

    // 84 (C6) smart_wrapped to [36, 83] should wrap down to 36 (C2)
    expect(useMidiStore.getState().activeState.lastPlayedMidi).toBe(84);
    expect(useMidiStore.getState().uiState.outputActiveKeys).toContain(36);
    expect(useMidiStore.getState().uiState.activeKeys).toContain(84); // Physical key pressed visual representation
  });

  it('Phase 1 UI Check: drops Play/Start zone clicked keys when filter drops them', () => {
    useMidiStore.setState({
      globalSettings: {
        midiInPort: null,
        power: true,
        channelFilter: 'ALL',
        startOctave: 4,
        roundPreference: 'UP',
        filterMode: 'octave_wrap',
        filterRange: [40, 45],
        inputKeyboardSize: 88,
      },
      playStartSettings: {
        rounded: false,
        audible: true,
        octaveOffset: 0,
      },
    });

    const { container } = render(<KeySplitKeyboard />);
    const key = container.querySelector('#pksplit-84'); // C6
    expect(key).toBeDefined();

    if (key) {
      fireEvent.mouseDown(key);
    }

    // 84 (C6) cannot be wrapped into [40, 45] via octave wrapping (no pitch class C exists in [40, 45])
    expect(useMidiStore.getState().activeState.lastPlayedMidi).toBe(84);
    expect(useMidiStore.getState().uiState.outputActiveKeys).not.toContain(84);
    expect(useMidiStore.getState().uiState.activeKeys).toContain(84); // Physical key is still visually active on input keyboard
  });

  it('Phase 3 Checkpoint: Test Case 1 - Given octaveOffset is -2 and lastPlayedMidi is 60 (C4), Assert physical key 84 (C6) evaluates isKeyActive as true (colored cyan)', () => {
    useMidiStore.setState({
      globalSettings: {
        midiInPort: null,
        power: true,
        channelFilter: 'ALL',
        startOctave: 4,
        roundPreference: 'UP',
        filterMode: 'smart_wrap',
        filterRange: [36, 83],
        inputKeyboardSize: 88,
      },
      playStartSettings: {
        rounded: false,
        audible: true,
        octaveOffset: -2,
      },
      activeState: {
        rootNote: 0,
        scaleDecimalId: 2741,
        lastPlayedMidi: 60, // C4
        keySwitches: [],
        selectedScaleIndex: 0,
        activeSwitchIndex: 0,
      }
    });

    const { container } = render(<KeySplitKeyboard />);
    const key = container.querySelector('#pksplit-84') as HTMLElement; // C6
    expect(key).toBeDefined();

    // Check style: if isKeyActive is true, it should have the zone's color (cyan: #06b6d4)
    expect(key?.style.backgroundColor).toBe('rgb(6, 182, 212)'); // CSS hex '#06b6d4' corresponds to rgb(6, 182, 212)
  });

  it('Phase 3 - Test Case 1: Render the component with size = 49. Assert exactly 49 key elements are generated in the DOM', () => {
    useMidiStore.setState({
      globalSettings: {
        midiInPort: null,
        power: true,
        channelFilter: 'ALL',
        startOctave: 4,
        roundPreference: 'UP',
        filterMode: 'smart_wrap',
        filterRange: [36, 83],
        inputKeyboardSize: 49,
      },
    });

    const { container } = render(<KeySplitKeyboard />);
    const keys = container.querySelectorAll('[id^="pksplit-"]');
    expect(keys.length).toBe(49);
  });

  it('Phase 1 - Test Case 1: Render the component with size = 49. Query the "STEPPER" header element and assert its calculated inline style width matches 7 * 19', () => {
    useMidiStore.setState({
      globalSettings: {
        midiInPort: null,
        power: true,
        channelFilter: 'ALL',
        startOctave: 4,
        roundPreference: 'UP',
        filterMode: 'smart_wrap',
        filterRange: [36, 83],
        inputKeyboardSize: 49,
      },
    });

    const { container } = render(<KeySplitKeyboard />);
    const stepperHeader = container.querySelector('#zone-stepper') as HTMLElement;
    expect(stepperHeader).not.toBeNull();
    expect(stepperHeader.style.width).toBe('133px');
  });

  it('Phase 2 - Test Case 1: Assert the header container and keys container share the exact same centering constraints', () => {
    const { container } = render(<KeySplitKeyboard />);
    const keysContainer = container.querySelector('#keyboard-wrapper') as HTMLElement;
    expect(keysContainer).not.toBeNull();

    const headerContainer = keysContainer.previousElementSibling as HTMLElement;
    expect(headerContainer).not.toBeNull();

    const parentContainer = keysContainer.parentElement as HTMLElement;
    expect(parentContainer).not.toBeNull();

    expect(parentContainer.style.display).toBe('flex');
    expect(parentContainer.style.flexDirection).toBe('column');
    expect(parentContainer.style.alignItems).toBe('center');
    expect(headerContainer.style.width).toBe(keysContainer.style.width);
  });

  it('Phase 1 - Test Case 1: Render the component and assert the centering wrapper (outermost wrapper for the keyboard and banners) has the increased marginTop applied', () => {
    const { container } = render(<KeySplitKeyboard />);
    const keysContainer = container.querySelector('#keyboard-wrapper') as HTMLElement;
    expect(keysContainer).not.toBeNull();
    const parentContainer = keysContainer.parentElement as HTMLElement;
    expect(parentContainer).not.toBeNull();
    expect(parentContainer.style.marginTop).toBe('32px');
  });

  it('Phase 2 - Test Case 1: Query the Octave Knob wrapper in the DOM and assert the top property is -16px and the transform property is translate(-50%, -50%)', () => {
    const { container } = render(<KeySplitKeyboard />);
    const cyanBanner = container.querySelector('#zone-play-start') as HTMLElement;
    expect(cyanBanner).not.toBeNull();
    const octaveKnobEl = cyanBanner.querySelector('.cursor-ns-resize') as HTMLElement;
    expect(octaveKnobEl).not.toBeNull();
    const wrapper = octaveKnobEl.parentElement?.parentElement as HTMLElement;
    expect(wrapper).not.toBeNull();
    expect(wrapper.style.top).toBe('-16px');
    expect(wrapper.style.transform).toBe('translate(-50%, -50%)');
  });

  it('Phase 1 - Test Case 2: Assert the full-width control container (previous right-aligned row) no longer exists', () => {
    const { container } = render(<KeySplitKeyboard />);
    const playStartControls = container.querySelector('#play-start-controls');
    expect(playStartControls).toBeNull();
  });

  it('Phase 1 - Test Case 3: Render the component and assert the outermost card container has reduced vertical padding applied', () => {
    const { container } = render(<KeySplitKeyboard />);
    const cardEl = container.firstElementChild as HTMLElement;
    expect(cardEl).not.toBeNull();
    expect(cardEl.className).toContain('pt-3');
    expect(cardEl.className).toContain('pb-2');
  });

  it('Phase 1 - TDD Test Case 1: Simulate a pointer down event on C#4 (MIDI 61) in the UI while stepperInvertToggle is true. Assert processStepperAction is called with index 13', () => {
    useMidiStore.setState({
      globalSettings: {
        ...useMidiStore.getState().globalSettings,
        inputKeyboardSize: 88,
      },
      uiState: {
        ...useMidiStore.getState().uiState,
        stepperInvertToggle: true,
      }
    });

    const processStepperActionSpy = vi.spyOn(useMidiStore.getState(), 'processStepperAction');

    const { container } = render(<KeySplitKeyboard />);
    const key = container.querySelector('#pksplit-61');
    expect(key).not.toBeNull();

    if (key) {
      fireEvent.mouseDown(key);
    }

    expect(processStepperActionSpy).toHaveBeenCalledWith(13, true, expect.any(Function));
    processStepperActionSpy.mockRestore();
  });

  it('Phase 2 - Test Case 1: Verify the active highlight logic relies solely on physical active keys without inversion modifiers (88-key mode)', () => {
    useMidiStore.setState({
      globalSettings: {
        ...useMidiStore.getState().globalSettings,
        inputKeyboardSize: 88,
      },
      uiState: {
        ...useMidiStore.getState().uiState,
        activeKeys: [48],
        stepperInvertToggle: true,
      }
    });

    const { container } = render(<KeySplitKeyboard />);
    const key = container.querySelector('#pksplit-48') as HTMLElement;
    expect(key).not.toBeNull();
    expect(key?.style.backgroundColor).toBe('rgb(59, 130, 246)');
  });

  it('Phase 2 - Test Case 2: Verify the active highlight logic correctly maps stepper active keys in 49-key mode', () => {
    useMidiStore.setState({
      globalSettings: {
        ...useMidiStore.getState().globalSettings,
        inputKeyboardSize: 49,
      },
      uiState: {
        ...useMidiStore.getState().uiState,
        activeKeys: [48],
        stepperInvertToggle: true,
      }
    });

    const { container } = render(<KeySplitKeyboard />);
    const key = container.querySelector('#pksplit-60') as HTMLElement;
    expect(key).not.toBeNull();
    expect(key?.style.backgroundColor).toBe('rgb(59, 130, 246)');
  });
});
