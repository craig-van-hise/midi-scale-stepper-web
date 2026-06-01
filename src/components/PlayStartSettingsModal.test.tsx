import { describe, it, expect, vi } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import React from 'react';
import PlayStartSettingsModal from './PlayStartSettingsModal';
import { useMidiStore } from '../store/useMidiStore';

describe('PlayStartSettingsModal', () => {
  it('renders and allows toggling audible selection setting', () => {
    // Force default state
    useMidiStore.setState({
      playStartSettings: {
        audible: true,
        rounded: false,
        octaveOffset: 0,
      }
    });

    const updateSpy = vi.spyOn(useMidiStore.getState(), 'updatePlayStartSettings');

    const { container } = render(
      <PlayStartSettingsModal isOpen={true} onClose={() => {}} />
    );

    const toggleAudibleBtn = container.querySelector('#toggle-audible');
    expect(toggleAudibleBtn).toBeDefined();

    if (toggleAudibleBtn) {
      fireEvent.click(toggleAudibleBtn);
    }

    expect(updateSpy).toHaveBeenCalledWith({ audible: false });
  });

  it('renders and allows toggling rounding setting', () => {
    // Force default state
    useMidiStore.setState({
      playStartSettings: {
        audible: true,
        rounded: false,
        octaveOffset: 0,
      }
    });

    const updateSpy = vi.spyOn(useMidiStore.getState(), 'updatePlayStartSettings');

    const { container } = render(
      <PlayStartSettingsModal isOpen={true} onClose={() => {}} />
    );

    const toggleRoundedBtn = container.querySelector('#toggle-rounded');
    expect(toggleRoundedBtn).toBeDefined();

    if (toggleRoundedBtn) {
      fireEvent.click(toggleRoundedBtn);
    }

    expect(updateSpy).toHaveBeenCalledWith({ rounded: true });
  });
});
