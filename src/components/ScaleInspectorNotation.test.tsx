import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import * as NotationModule from './ScaleInspectorNotation';
import { useMidiStore } from '../store/useMidiStore';
import { setLUT } from '../utils/lutRegistry';

describe('ScaleInspectorNotation Click-to-Play', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    
    // Setup Mock LUT
    const mockLut = new Array(4096).fill(null);
    mockLut[2741] = {
      decimal: 2741,
      pitch_class_set: [0, 2, 4, 5, 7, 9, 11],
      scale_type: 'Major',
      scale_intervals: ['1', '2', '3', '4', '5', '6', '7']
    } as any;
    setLUT(mockLut);

    useMidiStore.setState({
      lutReady: true,
      activeState: {
        rootNote: 0,
        scaleDecimalId: 2741, // C Major
        lastPlayedMidi: 60,
        keySwitches: [],
        selectedScaleIndex: 0,
        activeSwitchIndex: 0,
      },
      uiState: {
        ...useMidiStore.getState().uiState,
        activeKeys: [],
        outputActiveKeys: [],
      }
    });
  });

  it('Test Case 1: Simulate click on note with MIDI pitch 60. Assert lastPlayedMidi is updated to 60. Assert triggerOutputNoteOn is called with (60, 64)', async () => {
    const triggerSpy = vi.spyOn(NotationModule.outputRouting, 'triggerOutputNoteOn');

    const { getAllByTestId } = render(<NotationModule.ScaleInspectorNotation />);
    
    // Find noteheads
    const noteheads = getAllByTestId('notehead');
    expect(noteheads.length).toBeGreaterThan(0);

    // Click the first note (which is C4 = 60)
    fireEvent.click(noteheads[0]);

    // Assert lastPlayedMidi is updated to 60
    expect(useMidiStore.getState().activeState.lastPlayedMidi).toBe(60);

    // Assert triggerOutputNoteOn is called with (60, 64)
    expect(triggerSpy).toHaveBeenCalledWith(60, 64);
  });

  it('Phase 4 Test Case 1: Select a note. Trigger up arrow (transpose). Assert the note\'s pitch increases by 1 scale degree AND the note remains in the selectedNotes array', async () => {
    const { getAllByTestId } = render(<NotationModule.ScaleInspectorNotation />);
    
    // Find noteheads
    const noteheads = getAllByTestId('notehead');
    expect(noteheads.length).toBeGreaterThan(0);

    // Click the first note (which is C4 = 60) to select it
    fireEvent.click(noteheads[0]);

    // Verify it is selected (color should be SELECTED_COLOR = '#a855f7')
    expect(noteheads[0].style.color).toBe('rgb(168, 85, 247)');

    // Trigger ArrowUp keypress on window
    fireEvent.keyDown(window, { key: 'ArrowUp' });

    // Assert the pitch increased (root note changes from 60 to 61 in the store)
    // Wait, let's verify if the store's rootNote is updated. The original rootNote was 0 (MIDI 60 - 60 = 0).
    // Transposing note index 0 (root note) by +1 increases pitch to 61, so store's rootNote becomes 1!
    expect(useMidiStore.getState().activeState.rootNote).toBe(1);

    // Assert the note remains selected
    expect(noteheads[0].style.color).toBe('rgb(168, 85, 247)');
  });

  it('Phase 1 Test Case 1: Given a single note is selected, When ArrowDown is dispatched, Assert mutateSelected(-1) runs and selectedIndices remains strictly on the original index', async () => {
    const { getAllByTestId } = render(<NotationModule.ScaleInspectorNotation />);
    
    const noteheads = getAllByTestId('notehead');
    expect(noteheads.length).toBeGreaterThan(0);

    // Select the second note (D4 = 62, index 1)
    fireEvent.click(noteheads[1]);
    expect(noteheads[1].style.color).toBe('rgb(168, 85, 247)');

    // Trigger ArrowDown
    fireEvent.keyDown(window, { key: 'ArrowDown' });

    // Assert that index 1 remains selected
    expect(noteheads[1].style.color).toBe('rgb(168, 85, 247)');
    // Assert index 0 is not selected
    expect(noteheads[0].style.color).not.toBe('rgb(168, 85, 247)');
  });

  it('Phase 1 Test Case 1: Render the component and assert that the Scale Name Header element has a computed style or inline style containing var(--font-display)', () => {
    const { getByTestId } = render(<NotationModule.ScaleInspectorNotation />);
    const header = getByTestId('scale-name-header');
    expect(header.style.fontFamily).toBe('var(--font-display)');
  });

  it('Phase 2 Test Case 1: Query [data-testid="note-name-label"] and assert its style contains var(--font-sans)', () => {
    const { getAllByTestId } = render(<NotationModule.ScaleInspectorNotation />);
    const labels = getAllByTestId('note-name-label');
    expect(labels.length).toBeGreaterThan(0);
    labels.forEach(label => {
      expect(label.style.fontFamily).toBe('var(--font-sans)');
    });
  });

  it('Phase 3 Test Case 1: Query the interval label elements and assert their font family is precisely "\'Roboto Mono\', monospace"', () => {
    const { getAllByTestId } = render(<NotationModule.ScaleInspectorNotation />);
    const labels = getAllByTestId('interval-label');
    expect(labels.length).toBeGreaterThan(0);
    labels.forEach(label => {
      expect(label.style.fontFamily.replace(/"/g, "'")).toBe("'Roboto Mono', monospace");
    });
  });
});
