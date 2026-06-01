import { describe, it, expect, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import App from './App';
import { useMidiStore } from './store/useMidiStore';

describe('App Layout and Power Bypass', () => {
  beforeEach(() => {
    // Reset state before each test
    useMidiStore.setState({
      globalSettings: {
        midiInPort: null,
        power: true,
        channelFilter: 'ALL',
        startOctave: 4,
        roundPreference: 'UP',
        filterMode: 'smart_wrap',
        filterRange: [36, 83],
      },
      activeState: {
        ...useMidiStore.getState().activeState,
        rootNote: 0,
        scaleDecimalId: 2741,
        lastPlayedMidi: 60,
      },
    });
  });

  it('Given the App component renders, When inspecting the <main> tag, Assert className contains items-center and NOT items-start', () => {
    const { container } = render(<App />);
    const mainEl = container.querySelector('main');
    expect(mainEl).not.toBeNull();
    const classList = mainEl!.className.split(' ');
    expect(classList).toContain('items-center');
    expect(classList).not.toContain('items-start');
  });

  it('Given the globalSettings.power state is false, When the App renders, Assert the <main> tag contains pointer-events-none and opacity-50', () => {
    // Force power state to false
    useMidiStore.setState({
      globalSettings: {
        midiInPort: null,
        power: false,
        channelFilter: 'ALL',
        startOctave: 4,
        roundPreference: 'UP',
        filterMode: 'smart_wrap',
        filterRange: [36, 83],
      }
    });

    const { container } = render(<App />);
    const mainEl = container.querySelector('main');
    expect(mainEl).not.toBeNull();
    const classList = mainEl!.className.split(' ');
    expect(classList).toContain('pointer-events-none');
    expect(classList).toContain('opacity-50');
  });
});
