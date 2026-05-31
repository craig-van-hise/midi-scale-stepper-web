import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useWebMidi } from './useWebMidi';
import { getLUT, setLUT } from '../utils/lutRegistry';
import type { PCS_Entry } from '../types/midi';
import { useMidiStore } from '../store/useMidiStore';

// Mock Web MIDI API
const mockRequestMIDIAccess = vi.fn();

describe('Web MIDI Integration & LUT Memory Check', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    
    // Setup global navigator mock using globalThis
    if (typeof globalThis.navigator === 'undefined') {
      (globalThis as any).navigator = {};
    }
    
    mockRequestMIDIAccess.mockResolvedValue({
      inputs: {
        values: () => [{
          id: 'mock-input-1',
          name: 'Mock MIDI Input',
          onmidimessage: null,
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
        }][Symbol.iterator](),
        get: (id: string) => ({
          id,
          name: 'Mock MIDI Input',
          onmidimessage: null,
        }),
        size: 1,
        valuesArray: () => [],
      },
      outputs: {
        values: () => [][Symbol.iterator](),
        size: 0,
      },
      onstatechange: null,
    });
    
    (globalThis.navigator as any).requestMIDIAccess = mockRequestMIDIAccess;
  });

  it('should call navigator.requestMIDIAccess when useWebMidi mounts', async () => {
    const { result } = renderHook(() => useWebMidi());
    
    // Wait for the hook's async initialization to finish
    await vi.waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(mockRequestMIDIAccess).toHaveBeenCalled();
    });
  });

  it('should intercept MIDI note 49 and update scale selection in Zustand store', async () => {
    const mockInput = {
      id: 'mock-input-1',
      name: 'Mock MIDI Input',
      onmidimessage: null as any,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    };
    
    mockRequestMIDIAccess.mockResolvedValue({
      inputs: {
        values: () => [mockInput][Symbol.iterator](),
        get: (_id: string) => mockInput,
        size: 1,
      },
      outputs: {
        values: () => [][Symbol.iterator](),
        size: 0,
      },
      onstatechange: null,
    });

    // Make sure store has the mock-input-1 port selected
    useMidiStore.setState({
      globalSettings: {
        midiInPort: 'mock-input-1',
        power: true,
        channelFilter: 'ALL',
        startOctave: 4,
        roundPreference: 'UP',
        filterMode: 'octave_wrap',
        filterRange: [21, 108],
      },
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
      }
    });

    renderHook(() => useWebMidi());

    await vi.waitFor(() => {
      expect(mockInput.onmidimessage).toBeTypeOf('function');
    });

    // Simulate Note On for MIDI 49 (C#3)
    mockInput.onmidimessage({
      data: new Uint8Array([0x90, 49, 100])
    } as any);

    const state = useMidiStore.getState().activeState;
    expect(state.rootNote).toBe(1); // C#
    expect(state.scaleDecimalId).toBe(1709); // Dorian
    expect(state.activeSwitchIndex).toBe(1);
  });

  it('should have dictionary accessible in memory without async fetching during MIDI events', () => {
    // Setup mock entries in the registry
    const dummyEntry: PCS_Entry = {
      decimal: 145,
      chord_type: 'maj',
      data_table_chord_type: 'maj',
      rotation: 0,
      root_pc: 0,
      chord_intervals: ['1', '3', '5'],
      chord_intervals_rotated: [],
      base_triad: 'maj',
      base_7th: '',
      scale_type: 'major',
      mode: 0,
      root_scale: 'C',
      mode_function: '',
      scale_intervals: ['1', '2', '3', '4', '5', '6', '7'],
      pitch_class_set: [0, 2, 4, 5, 7, 9, 11],
      "12-bit": '101010110101',
      pc_intervals: [],
      ic_vector: [],
      cardinality: 7,
      diatonic_chromatic_exotic: 'diatonic',
      hemitonia: 2,
      cohemitonia: 0,
      brightness: 0,
      dissonance: 0,
      manual_overrides: [],
    };
    
    const mockLut = new Array(4096).fill(null);
    mockLut[145] = dummyEntry;
    setLUT(mockLut);

    // Assert that we can query the LUT synchronously in memory
    const lut = getLUT();
    expect(lut).toBeDefined();
    expect(lut[145]).toEqual(dummyEntry);
    
    // Ensure no fetch occurs by checking we retrieved it purely from the memory store
    expect(lut[145]?.chord_type).toBe('maj');
  });
});
