import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import React from 'react';
import KeySwitchContainer from './KeySwitchContainer';

vi.mock('./ScaleKeySwitches12', () => ({
  default: () => <div data-scales-count="12" />
}));

describe('KeySwitchContainer & Stepper Labels', () => {
  it('renders both ScaleKeySwitches12 and ScaleStepperKeySwitches25 within the shared wrapper', () => {
    const { container } = render(<KeySwitchContainer />);
    
    // Check wrapper container
    const wrapper = container.querySelector('#keyswitch-container-card');
    expect(wrapper).not.toBeNull();

    // Check ScaleKeySwitches12 presence (has data-scales-count="12")
    const scaleSelect = container.querySelector('[data-scales-count="12"]');
    expect(scaleSelect).not.toBeNull();

    // Check ScaleStepperKeySwitches25 presence (has data-keys-count="25")
    const stepper = container.querySelector('[data-keys-count="25"]');
    expect(stepper).not.toBeNull();
  });

  it('asserts that dynamic interval text nodes are no longer present in ScaleStepperKeySwitches25', () => {
    const { queryByText } = render(<KeySwitchContainer />);

    // These were the interval labels in STEPPER_DATA_MAP:
    // '-P8', '-m7', '-m6', '-P5', '-P4', '-m3', '-m2', 'Unison', '+M2', '+M3', '+P4', '+P5', '+M6', '+M7', '+P8'
    expect(queryByText('-P8')).toBeNull();
    expect(queryByText('Unison')).toBeNull();
    expect(queryByText('+M2')).toBeNull();
    expect(queryByText('+P8')).toBeNull();
  });

  it('Given KeySwitchContainer renders, Assert the cog is absent', () => {
    const { container } = render(<KeySwitchContainer />);
    const cog = container.querySelector('#scale-change-settings-cog');
    expect(cog).toBeNull();
  });
});
