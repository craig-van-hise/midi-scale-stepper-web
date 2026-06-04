import { describe, it, expect, beforeEach } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import KeySplitKeyboard from './KeySplitKeyboard';
import { useMidiStore } from '../store/useMidiStore';

describe('InputSettingsModal Integration', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
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
    });
  });

  it('Phase 4 - Test Case 1: Assert clicking the cog opens the modal', () => {
    const { container } = render(<KeySplitKeyboard />);
    
    // Check that modal is not open initially
    expect(document.body.querySelector('#input-settings-modal')).toBeNull();

    // Click the settings cog
    const cog = container.querySelector('#toggle-input-settings');
    expect(cog).not.toBeNull();
    fireEvent.click(cog!);

    // Assert the modal is now open in the portal
    expect(document.body.querySelector('#input-settings-modal')).not.toBeNull();
  });

  it('Phase 4 - Test Case 2: Assert selecting "49-Key" triggers the store action', () => {
    const { container } = render(<KeySplitKeyboard />);
    
    // Click the cog to open modal
    const cog = container.querySelector('#toggle-input-settings');
    fireEvent.click(cog!);

    const radio49 = document.body.querySelector('#input-keyboard-size-49-button');
    expect(radio49).not.toBeNull();

    // Store should initially be 88
    expect(useMidiStore.getState().globalSettings.inputKeyboardSize).toBe(88);

    // Select 49-Key radio button
    fireEvent.click(radio49!);

    // Assert size changes to 49
    expect(useMidiStore.getState().globalSettings.inputKeyboardSize).toBe(49);
  });
});
