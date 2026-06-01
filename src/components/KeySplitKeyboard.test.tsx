import { describe, it, expect, beforeEach } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import React from 'react';
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
    const key = container.querySelector('#pksplit-84'); // C6
    expect(key).toBeDefined();

    // Check style: if isKeyActive is true, it should have the zone's color (cyan: #06b6d4)
    expect(key?.style.backgroundColor).toBe('rgb(6, 182, 212)'); // CSS hex '#06b6d4' corresponds to rgb(6, 182, 212)
  });
});
