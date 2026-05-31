import { describe, it, expect } from 'vitest';
import { render, fireEvent, screen } from '@testing-library/react';
import { NoteRangeFilterKeyboard } from './NoteRangeFilterKeyboard';

// Mock the Zustand store if needed, or let it use the real one.
// Let's write the TDD tests that will fail initially.

describe('NoteRangeFilterKeyboard Output Keyboard & Settings', () => {
  it('displays standard note names instead of MIDI integer values in slider labels', () => {
    // Render the keyboard with range [60, 84] (which corresponds to C4 and C6)
    render(
      <NoteRangeFilterKeyboard 
        activeMode="octave_wrap"
        onModeChange={() => {}}
        range={[60, 84]}
        onRangeChange={() => {}}
      />
    );

    // Assert that the labels show C4 and C6 instead of 60 and 84
    expect(screen.queryByText('60')).toBeNull();
    expect(screen.queryByText('84')).toBeNull();
    expect(screen.getByTestId('thumb-min').textContent).toContain('C4');
    expect(screen.getByTestId('thumb-max').textContent).toContain('C6');
  });

  it('exposes only Octave Wrap and Smart Wrap in the settings menu', () => {
    render(
      <NoteRangeFilterKeyboard 
        activeMode="octave_wrap"
        onModeChange={() => {}}
        range={[60, 84]}
        onRangeChange={() => {}}
      />
    );

    // Open settings modal by clicking the gear icon
    const gearIcon = screen.getByTitle('Output Filter Settings');
    fireEvent.click(gearIcon);

    // Assert only 'Octave Wrap' and 'Smart Wrap' are available options.
    // 'Block', 'Wrap', and 'Limit' option inputs should not be present in the document.
    expect(screen.queryByTestId('filter-mode-option-block')).toBeNull();
    expect(screen.queryByTestId('filter-mode-option-wrap')).toBeNull();
    expect(screen.queryByTestId('filter-mode-option-limit')).toBeNull();

    expect(screen.getByTestId('filter-mode-option-octave_wrap')).not.toBeNull();
    expect(screen.getByTestId('filter-mode-option-smart_wrap')).not.toBeNull();
  });
});
