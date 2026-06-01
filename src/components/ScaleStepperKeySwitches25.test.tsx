import { describe, it, expect, vi } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import React from 'react';
import ScaleStepperKeySwitches25 from './ScaleStepperKeySwitches25';
import { executeScaleStep } from '../utils/ScaleStepperEngine';
import { useMidiStore } from '../store/useMidiStore';

vi.mock('../utils/ScaleStepperEngine', () => ({
  executeScaleStep: vi.fn(),
}));

describe('ScaleStepperKeySwitches25', () => {
  it('should call executeScaleStep with positive/negative integer offsets when UI keys are pressed', () => {
    // Set to standard C Major scale
    useMidiStore.setState({
      activeState: {
        rootNote: 0,
        scaleDecimalId: 2741,
        selectedScaleIndex: 0,
        activeSwitchIndex: 0,
        lastPlayedMidi: 60,
        keySwitches: [],
      },
      globalSettings: {
        midiInPort: null,
        power: true,
        channelFilter: 'ALL',
        startOctave: 4,
        roundPreference: 'UP',
        filterMode: 'octave_wrap',
        filterRange: [21, 108],
      }
    });

    const { container } = render(<ScaleStepperKeySwitches25 />);

    // Find keys of type white or black
    const keys = container.querySelectorAll('[data-key-type="white"], [data-key-type="black"]');
    
    let plusThreeKey: Element | null = null;
    let minusThreeKey: Element | null = null;

    keys.forEach((key) => {
      const span = key.querySelector('span');
      if (span && span.textContent === '+3') {
        plusThreeKey = key;
      }
      if (span && span.textContent === '-3') {
        minusThreeKey = key;
      }
    });

    expect(plusThreeKey).not.toBeNull();
    expect(minusThreeKey).not.toBeNull();

    // Trigger pointer down on '+3' key
    fireEvent.pointerDown(plusThreeKey!);
    expect(executeScaleStep).toHaveBeenCalledWith(3);
  });

  it('Phase 2 Checkpoint: Render the component with C Major Pentatonic and "Round Up". Assert the key for MIDI 65 (F) displays the text "+3"', () => {
    useMidiStore.setState({
      activeState: {
        rootNote: 0,
        scaleDecimalId: 2741, // C Major Pentatonic
        selectedScaleIndex: 0,
        activeSwitchIndex: 0,
        lastPlayedMidi: 60,
        keySwitches: [],
      },
      globalSettings: {
        midiInPort: null,
        power: true,
        channelFilter: 'ALL',
        startOctave: 4,
        roundPreference: 'UP',
        filterMode: 'octave_wrap',
        filterRange: [21, 108],
      }
    });

    const { container } = render(<ScaleStepperKeySwitches25 />);
    
    const key65 = container.querySelector('[data-key-index="17"]');
    expect(key65).not.toBeNull();

    const span = key65?.querySelector('span');
    expect(span?.textContent).toBe('+3');
  });

  it('Phase 2 Checkpoint: Simulate pointerdown and pointerup on key', () => {
    const { container } = render(<ScaleStepperKeySwitches25 />);
    const key65 = container.querySelector('[data-key-index="17"]');
    expect(key65).not.toBeNull();

    // Simulate pointerdown
    fireEvent.pointerDown(key65!);
    expect(executeScaleStep).toHaveBeenCalled();

    // Simulate pointerup
    fireEvent.pointerUp(key65!);
  });
});
