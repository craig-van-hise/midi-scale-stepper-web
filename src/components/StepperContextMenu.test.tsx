import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import StepperContextMenu, { generateLabel } from './StepperContextMenu';
import type { StepperAction } from '../types/midi';
import { useMidiStore } from '../store/useMidiStore';

describe('StepperContextMenu Portal & Controls', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('Phase 2 - Test Case 1: Render the component and assert that it mounts into document.body rather than the standard React root', () => {
    const initialAction: StepperAction = { type: 'STEP', value: 12, label: '+12' };
    const { container } = render(
      <StepperContextMenu
        x={100}
        y={150}
        index={0}
        initialAction={initialAction}
        onClose={() => {}}
      />
    );

    // It should NOT be within the standard container
    expect(container.querySelector('#stepper-context-menu')).toBeNull();

    // It should be inside the document.body
    const menuElement = document.body.querySelector('#stepper-context-menu');
    expect(menuElement).not.toBeNull();
    expect(menuElement?.parentElement).toBe(document.body);
  });

  it('Phase 1 - Test Case 1: Call generateLabel("OCTAVE", -1). Assert the return value is "-Oct"', () => {
    expect(generateLabel('OCTAVE', -1)).toBe('-Oct');
  });

  it('Phase 2 - Test Case 1: Simulate a KeyDown event with key: "Delete" on the portal container. Assert it does not bubble to a parent element', () => {
    const initialAction: StepperAction = { type: 'STEP', value: 3, label: '+3' };
    const parentSpy = vi.fn();
    
    render(
      <div onKeyDown={parentSpy}>
        <StepperContextMenu
          x={100}
          y={150}
          index={0}
          initialAction={initialAction}
          onClose={() => {}}
        />
      </div>
    );
    
    const menuElement = document.body.querySelector('#stepper-context-menu');
    expect(menuElement).not.toBeNull();

    fireEvent.keyDown(menuElement!, {
      key: 'Delete',
    });
    
    expect(parentSpy).not.toHaveBeenCalled();
  });

  it('Phase 2 - Test Case 2: Simulate a KeyDown event with key: "Enter". Assert the save function is called', () => {
    const initialAction: StepperAction = { type: 'STEP', value: 3, label: '+3' };
    const onCloseSpy = vi.fn();
    const updateSpy = vi.spyOn(useMidiStore.getState(), 'updateStepperConfig');

    render(
      <StepperContextMenu
        x={100}
        y={150}
        index={0}
        initialAction={initialAction}
        onClose={onCloseSpy}
      />
    );
    const menuElement = document.body.querySelector('#stepper-context-menu');
    expect(menuElement).not.toBeNull();

    fireEvent.keyDown(menuElement!, { key: 'Enter' });

    expect(updateSpy).toHaveBeenCalledWith(0, {
      type: 'STEP',
      value: 3,
      label: '+3',
    });
    expect(onCloseSpy).toHaveBeenCalled();
    updateSpy.mockRestore();
  });
});
