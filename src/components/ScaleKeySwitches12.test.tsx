import { describe, it, expect } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import React from 'react';
import ScaleKeySwitches12 from './ScaleKeySwitches12';
import { useMidiStore } from '../store/useMidiStore';

describe('ScaleKeySwitches12 Settings Cog', () => {
  it('Given ScaleKeySwitches12 renders, Assert the Settings cog is present inside the #scale-key-switches-strip element and clicking it opens the modal', () => {
    // Make sure useMidiStore has a default valid state
    useMidiStore.setState({
      activeState: {
        rootNote: 0,
        scaleDecimalId: 2741,
        lastPlayedMidi: 60,
        keySwitches: [
          { root: 'C', type: 'Major' },
          { root: 'C#', type: 'Dorian' },
          { root: 'D', type: 'Phrygian' },
          { root: 'D#', type: 'Lydian' },
          { root: 'E', type: 'Mixolydian' },
          { root: 'F', type: 'Natural Minor' },
          { root: 'F#', type: 'Locrian' },
          { root: 'G', type: 'Harmonic Minor' },
          { root: 'G#', type: 'Melodic Minor' },
          { root: 'A', type: 'Pentatonic Major' },
          { root: 'A#', type: 'Pentatonic Minor' },
          { root: 'B', type: 'Blues' }
        ],
        selectedScaleIndex: 0,
        activeSwitchIndex: 0,
        isFirstNote: true,
      }
    });

    const { container, queryByText } = render(<ScaleKeySwitches12 />);
    
    // Check that scale-key-switches-strip exists
    const strip = container.querySelector('#scale-key-switches-strip');
    expect(strip).not.toBeNull();

    // Assert Settings Cog is inside the strip
    const cog = strip?.querySelector('#scale-change-settings-cog');
    expect(cog).not.toBeNull();

    // Modal is initially closed
    expect(queryByText('Scale Change Settings')).toBeNull();

    // Click the settings cog
    fireEvent.click(cog!);

    // Modal should now be open
    expect(queryByText('Scale Change Settings')).not.toBeNull();
  });

  it('Given ScaleKeySwitches12 renders, Assert createPortal is successfully imported and used to render menus inside document.body', () => {
    useMidiStore.setState({
      activeState: {
        rootNote: 0,
        scaleDecimalId: 2741,
        lastPlayedMidi: 60,
        keySwitches: [
          { root: 'C', type: 'Major' },
          { root: 'C#', type: 'Dorian' },
          { root: 'D', type: 'Phrygian' },
          { root: 'D#', type: 'Lydian' },
          { root: 'E', type: 'Mixolydian' },
          { root: 'F', type: 'Natural Minor' },
          { root: 'F#', type: 'Locrian' },
          { root: 'G', type: 'Harmonic Minor' },
          { root: 'G#', type: 'Melodic Minor' },
          { root: 'A', type: 'Pentatonic Major' },
          { root: 'A#', type: 'Pentatonic Minor' },
          { root: 'B', type: 'Blues' }
        ],
        selectedScaleIndex: 0,
        activeSwitchIndex: 0,
        isFirstNote: true,
      }
    });

    const { getByTestId, queryByTestId } = render(<ScaleKeySwitches12 />);

    // Click the root selector trigger on the strip
    const rootTrigger = getByTestId('top-strip-root');
    expect(rootTrigger).not.toBeNull();
    
    // Before click, root menu shouldn't be in the body
    expect(queryByTestId('root-option-C')).toBeNull();

    // Click to open root menu
    fireEvent.click(rootTrigger);

    // Root option C should be in document body (as a portal)
    const rootOption = getByTestId('root-option-C');
    expect(rootOption).not.toBeNull();
    
    // Check that it's rendered inside a portal (under document.body)
    const menuContainer = rootOption.parentElement;
    expect(menuContainer?.parentElement).toBe(document.body);
    
    // Assert the menu element opacity is default/solid (not inheriting translucency, meaning it has solid styling or is not in the span)
    // The trigger is a span with hover:opacity-75, but the menu is not inside it.
    expect(rootTrigger.contains(menuContainer)).toBe(false);
  });
});
