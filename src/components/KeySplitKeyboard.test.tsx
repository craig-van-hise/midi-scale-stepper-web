import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, act } from '@testing-library/react';
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
        keySwitches: [],
        selectedScaleIndex: 0,
        activeSwitchIndex: 0,
      },
      uiState: {
        activeKeys: [],
        outputActiveKeys: [],
      },
    });
  });

  it('sets rootNote to 0 when MIDI 36 (C2) is triggered (Root Select split)', async () => {
    render(<KeySplitKeyboard />);

    // Simulate MIDI note on event for C2 (36) by adding to activeKeys in the store
    act(() => {
      useMidiStore.getState().addActiveKey(36);
    });

    // Assert that activeState.rootNote is set to 0 (36 % 12 = 0)
    await vi.waitFor(() => {
      expect(useMidiStore.getState().activeState.rootNote).toBe(0);
    });
  });

  it('passes MIDI 24 (C1) to Thru zone without altering root or scale states', async () => {
    render(<KeySplitKeyboard />);

    // Simulate note on for MIDI 24 (outside root select, scale select, stepper range)
    act(() => {
      useMidiStore.getState().addActiveKey(24);
    });

    // Assert that root and scale states remain null
    await vi.waitFor(() => {
      expect(useMidiStore.getState().uiState.activeKeys).toContain(24);
    });
    
    expect(useMidiStore.getState().activeState.rootNote).toBeNull();
    expect(useMidiStore.getState().activeState.scaleDecimalId).toBeNull();
  });
});
