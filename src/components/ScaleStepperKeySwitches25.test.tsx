import { describe, it, expect, vi } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import ScaleStepperKeySwitches25 from './ScaleStepperKeySwitches25';
import { executeScaleStep } from '../utils/ScaleStepperEngine';

vi.mock('../utils/ScaleStepperEngine', () => ({
  executeScaleStep: vi.fn(),
}));

describe('ScaleStepperKeySwitches25', () => {
  it('should call executeScaleStep with positive/negative integer offsets when UI keys are clicked', () => {
    const { container } = render(<ScaleStepperKeySwitches25 />);

    // Find keys of type white or black
    const keys = container.querySelectorAll('[data-key-type="white"], [data-key-type="black"]');
    
    let plusTwoKey: Element | null = null;
    let minusThreeKey: Element | null = null;

    keys.forEach((key) => {
      if (key.textContent === '+2') {
        plusTwoKey = key;
      }
      if (key.textContent === '-3') {
        minusThreeKey = key;
      }
    });

    expect(plusTwoKey).not.toBeNull();
    expect(minusThreeKey).not.toBeNull();

    // Click '+2' key
    fireEvent.click(plusTwoKey!);
    expect(executeScaleStep).toHaveBeenCalledWith(2);

    // Click '-3' key
    fireEvent.click(minusThreeKey!);
    expect(executeScaleStep).toHaveBeenCalledWith(-3);
  });
});
