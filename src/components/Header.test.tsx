
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import Header from './Header';
import { useMidiStore } from '../store/useMidiStore';

describe('Header Component', () => {
  beforeEach(() => {
    useMidiStore.getState().panic();
  });

  it('invokes store panic (clears active keys and lastPlayedMidi) when the Panic button is clicked', () => {
    // Populate store keys first
    useMidiStore.setState({
      uiState: {
        ...useMidiStore.getState().uiState,
        activeKeys: [60, 62, 64],
        outputActiveKeys: []
      },
      activeState: { rootNote: null, scaleDecimalId: null, lastPlayedMidi: 60, keySwitches: [], selectedScaleIndex: 0, activeSwitchIndex: 0 }
    });

    expect(useMidiStore.getState().uiState.activeKeys).toEqual([60, 62, 64]);
    expect(useMidiStore.getState().activeState.lastPlayedMidi).toBe(60);

    const { container } = render(
      <Header
        inputs={[]}
        onOpenSettings={vi.fn()}
        onOpenInfo={vi.fn()}
      />
    );

    const panicBtn = container.querySelector('#panic-button');
    expect(panicBtn).not.toBeNull();

    // Click the panic button
    fireEvent.click(panicBtn!);

    // Assert that the store is cleaned up
    expect(useMidiStore.getState().uiState.activeKeys).toEqual([]);
    expect(useMidiStore.getState().activeState.lastPlayedMidi).toBeNull();
  });
});
