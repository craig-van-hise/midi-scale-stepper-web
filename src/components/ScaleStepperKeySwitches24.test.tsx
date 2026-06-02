import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import ScaleStepperKeySwitches24, { getDynamicLabel } from './ScaleStepperKeySwitches24';
import { executeScaleStep } from '../utils/ScaleStepperEngine';
import { useMidiStore } from '../store/useMidiStore';

vi.mock('../utils/ScaleStepperEngine', () => ({
  executeScaleStep: vi.fn(),
}));

describe('ScaleStepperKeySwitches24', () => {
  beforeEach(() => {
    useMidiStore.getState().panic();
  });
  it('Phase 3 - Test Case 1: Render the component, assert there are 24 total keys', () => {
    const { container } = render(<ScaleStepperKeySwitches24 />);
    const keys = container.querySelectorAll('[data-key-type="white"], [data-key-type="black"]');
    expect(keys.length).toBe(24);
  });

  it('should call processStepperAction when UI keys are pressed', () => {
    const processSpy = vi.spyOn(useMidiStore.getState(), 'processStepperAction');

    const { container } = render(<ScaleStepperKeySwitches24 />);
    const keys = container.querySelectorAll('[data-key-type="white"], [data-key-type="black"]');
    
    let plusThreeKey: Element | null = null;
    let index = -1;

    keys.forEach((key, idx) => {
      const span = key.querySelector('span');
      if (span && span.textContent === '+3') {
        plusThreeKey = key;
        index = idx;
      }
    });

    if (plusThreeKey) {
      fireEvent.pointerDown(plusThreeKey);
      expect(processSpy).toHaveBeenCalledWith(index, true, expect.any(Function));
    }
  });

  it('Stepper Refinements Phase 2 - Test Case 1: Assert that clicking an INVERT_TOGGLE key does not update the selectedIndex state', () => {
    const { container } = render(<ScaleStepperKeySwitches24 />);
    // Select index is 12 (default)
    expect(container.firstChild).toHaveAttribute('data-selected-index', '12');

    // Click index 2 (INVERT_TOGGLE)
    const key2 = container.querySelector('[data-key-index="2"]');
    expect(key2).not.toBeNull();
    fireEvent.pointerDown(key2!);

    // Should still be 12
    expect(container.firstChild).toHaveAttribute('data-selected-index', '12');
  });

  it('Stepper Refinements Phase 2 - Test Case 2: Assert that INVERT_MOMENTARY only evaluates isSelected to true while stepperInvertMomentary is true in the store', () => {
    useMidiStore.setState({
      uiState: {
        ...useMidiStore.getState().uiState,
        stepperInvertMomentary: false
      }
    });

    const { container } = render(<ScaleStepperKeySwitches24 />);
    const key1 = container.querySelector('[data-key-index="1"]'); // INVERT_MOMENTARY black key
    expect(key1).not.toBeNull();
    
    // Unselected black key background color should be black
    expect((key1 as HTMLElement).style.backgroundColor).toBe('rgb(0, 0, 0)');

    // Now toggle momentary in store
    useMidiStore.setState({
      uiState: {
        ...useMidiStore.getState().uiState,
        stepperInvertMomentary: true
      }
    });

    // Rerender or check component update
    const { container: container2 } = render(<ScaleStepperKeySwitches24 />);
    const key1Active = container2.querySelector('[data-key-index="1"]');
    // Selected black key background color should be blue (#3b82f6 / rgb(59, 130, 246))
    expect((key1Active as HTMLElement).style.backgroundColor).toBe('rgb(59, 130, 246)');
  });

  it('Stepper Refinements Phase 3 - Test Case 1: Render the component and assert the presence of Lucide icon SVG elements in the utility key slots', () => {
    const { container } = render(<ScaleStepperKeySwitches24 />);
    const slots = [1, 2, 3, 4, 20, 21, 22, 23];
    slots.forEach((slot) => {
      const key = container.querySelector(`[data-key-index="${slot}"]`);
      expect(key).not.toBeNull();
      const svg = key!.querySelector('svg');
      expect(svg).not.toBeNull();
    });
  });

  it('Phase 1 - Test Case 1: Given action.label = "+3" and isInverted = true, Assert getDynamicLabel returns "-3"', () => {
    const action = { type: 'STEP', label: '+3', value: 3 };
    expect(getDynamicLabel(action, true)).toBe('-3');
  });

  it('Phase 1 - Test Case 2: Given action.label = "-Oct" and isInverted = true, Assert getDynamicLabel returns "+Oct"', () => {
    const action = { type: 'OCTAVE', label: '-Oct', value: -12 };
    expect(getDynamicLabel(action, true)).toBe('+Oct');
  });

  it('Phase 2 - Test Case 1: Render the component and assert that the text "Tog" and "Hold" are present in the document', () => {
    const { getAllByText } = render(<ScaleStepperKeySwitches24 />);
    expect(getAllByText('Tog').length).toBe(2);
    expect(getAllByText('Hold').length).toBe(2);
  });
});
