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

    // Simulate Note On for MIDI 37 (C#2)
    mockInput.onmidimessage({
      data: new Uint8Array([0x90, 37, 100])
    } as any);

    const state = useMidiStore.getState().activeState;
    expect(state.rootNote).toBe(1); // C#
    expect(state.scaleDecimalId).toBe(1709); // Dorian
    expect(state.activeSwitchIndex).toBe(1);
  });

  it('should ignore incoming MIDI messages if power is false', async () => {
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

    useMidiStore.setState({
      globalSettings: {
        midiInPort: 'mock-input-1',
        power: false,
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
          { root: 'C#', type: 'Dorian' }
        ],
        selectedScaleIndex: 0,
        activeSwitchIndex: 0,
      }
    });

    renderHook(() => useWebMidi());

    await vi.waitFor(() => {
      expect(mockInput.onmidimessage).toBeTypeOf('function');
    });

    // Simulate Note On for MIDI 37 (C#2) which would normally trigger root note 1 (C#)
    mockInput.onmidimessage({
      data: new Uint8Array([0x90, 37, 100])
    } as any);

    const state = useMidiStore.getState().activeState;
    expect(state.rootNote).toBe(0); // Remains C
    expect(state.scaleDecimalId).toBe(2741); // Remains Major
    expect(state.activeSwitchIndex).toBe(0);
  });

  it('should call triggerHomeReset and drop note when MIDI note 21 (Home) is received', async () => {
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

    useMidiStore.setState({
      globalSettings: {
        midiInPort: 'mock-input-1',
        power: true,
        channelFilter: 'ALL',
        startOctave: 3,
        roundPreference: 'UP',
        filterMode: 'octave_wrap',
        filterRange: [21, 108],
      },
      activeState: {
        rootNote: 2, // D
        scaleDecimalId: 2741,
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

    renderHook(() => useWebMidi());

    await vi.waitFor(() => {
      expect(mockInput.onmidimessage).toBeTypeOf('function');
    });

    const triggerSpy = vi.spyOn(useMidiStore.getState(), 'triggerHomeReset');

    mockInput.onmidimessage({
      data: new Uint8Array([0x90, 21, 100])
    } as any);

    expect(triggerSpy).toHaveBeenCalled();
    // lastPlayedMidi should update to 50 ((2 % 12) + (3+1)*12 = 50)
    expect(useMidiStore.getState().activeState.lastPlayedMidi).toBe(50);
    // Note 21 should be added to activeKeys for visual feedback
    expect(useMidiStore.getState().uiState.activeKeys).toContain(21);
  });

  it('Phase 2 Checkpoint: Test Case 1 - Simulate incoming MIDI NoteOn for note 21. Assert triggerHomeReset is called, and NO output NoteOn is dispatched', async () => {
    const mockInput = {
      id: 'mock-input-1',
      name: 'Mock MIDI Input',
      onmidimessage: null as any,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    };
    const mockSend = vi.fn();
    const mockOutput = {
      id: 'mock-output-1',
      name: 'Mock MIDI Output',
      send: mockSend,
    };
    
    mockRequestMIDIAccess.mockResolvedValue({
      inputs: {
        values: () => [mockInput][Symbol.iterator](),
        get: (_id: string) => mockInput,
        size: 1,
      },
      outputs: {
        values: () => [mockOutput][Symbol.iterator](),
        size: 1,
      },
      onstatechange: null,
    });

    useMidiStore.setState({
      globalSettings: {
        midiInPort: 'mock-input-1',
        power: true,
        channelFilter: 'ALL',
        startOctave: 3,
        roundPreference: 'UP',
        filterMode: 'octave_wrap',
        filterRange: [21, 108],
      },
      activeState: {
        rootNote: 2, // D
        scaleDecimalId: 2741,
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

    renderHook(() => useWebMidi());

    await vi.waitFor(() => {
      expect(mockInput.onmidimessage).toBeTypeOf('function');
    });

    const triggerSpy = vi.spyOn(useMidiStore.getState(), 'triggerHomeReset');

    mockInput.onmidimessage({
      data: new Uint8Array([0x90, 21, 100])
    } as any);

    expect(triggerSpy).toHaveBeenCalled();
    expect(useMidiStore.getState().activeState.lastPlayedMidi).toBe(50);
    expect(mockSend).not.toHaveBeenCalled();
  });

  it('Phase 2 Checkpoint: Test Case 2 - Simulate incoming MIDI NoteOn for note 22. Assert triggerHomeReset is NOT called, and NO output NoteOn is dispatched', async () => {
    const mockInput = {
      id: 'mock-input-1',
      name: 'Mock MIDI Input',
      onmidimessage: null as any,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    };
    const mockSend = vi.fn();
    const mockOutput = {
      id: 'mock-output-1',
      name: 'Mock MIDI Output',
      send: mockSend,
    };
    
    mockRequestMIDIAccess.mockResolvedValue({
      inputs: {
        values: () => [mockInput][Symbol.iterator](),
        get: (_id: string) => mockInput,
        size: 1,
      },
      outputs: {
        values: () => [mockOutput][Symbol.iterator](),
        size: 1,
      },
      onstatechange: null,
    });

    useMidiStore.setState({
      globalSettings: {
        midiInPort: 'mock-input-1',
        power: true,
        channelFilter: 'ALL',
        startOctave: 3,
        roundPreference: 'UP',
        filterMode: 'octave_wrap',
        filterRange: [21, 108],
      },
      activeState: {
        rootNote: 2, // D
        scaleDecimalId: 2741,
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

    renderHook(() => useWebMidi());

    await vi.waitFor(() => {
      expect(mockInput.onmidimessage).toBeTypeOf('function');
    });

    const triggerSpy = vi.spyOn(useMidiStore.getState(), 'triggerHomeReset');

    mockInput.onmidimessage({
      data: new Uint8Array([0x90, 22, 100])
    } as any);

    expect(triggerSpy).not.toHaveBeenCalled();
    expect(useMidiStore.getState().activeState.lastPlayedMidi).toBe(60);
    expect(mockSend).not.toHaveBeenCalled();
  });

  it('Phase 2 Checkpoint: Test Case 1 (Rounding ON, Audible ON)', async () => {
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
        rootNote: 0, // C
        scaleDecimalId: 2741, // C Major
        lastPlayedMidi: 60,
        keySwitches: [],
        selectedScaleIndex: 0,
        activeSwitchIndex: 0,
      },
      playStartSettings: {
        audible: true,
        rounded: true,
        octaveOffset: 0,
      },
      uiState: {
        ...useMidiStore.getState().uiState,
        activeKeys: [],
        outputActiveKeys: [],
      }
    });

    // Mock LUT entry for Major decimal 2741
    const mockLut = getLUT() || new Array(4096).fill(null);
    mockLut[2741] = {
      decimal: 2741,
      pitch_class_set: [0, 2, 4, 5, 7, 9, 11],
      scale_type: 'Major',
    } as any;
    setLUT(mockLut);

    renderHook(() => useWebMidi());

    await vi.waitFor(() => {
      expect(mockInput.onmidimessage).toBeTypeOf('function');
    });

    // NoteOn 73 (C#5 - not in scale)
    mockInput.onmidimessage({
      data: new Uint8Array([0x90, 73, 100])
    } as any);

    // C#5 (73) should round UP to D5 (74)
    expect(useMidiStore.getState().activeState.lastPlayedMidi).toBe(74);
    expect(useMidiStore.getState().uiState.activeKeys).not.toContain(74);
    expect(useMidiStore.getState().uiState.activeKeys).toContain(73);
    expect(useMidiStore.getState().uiState.outputActiveKeys).toContain(74);
  });

  it('Phase 2 Checkpoint: Test Case 2 (Rounding OFF, Audible ON)', async () => {
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
        keySwitches: [],
        selectedScaleIndex: 0,
        activeSwitchIndex: 0,
      },
      playStartSettings: {
        audible: true,
        rounded: false,
        octaveOffset: 0,
      },
      uiState: {
        ...useMidiStore.getState().uiState,
        activeKeys: [],
        outputActiveKeys: [],
      }
    });

    renderHook(() => useWebMidi());

    await vi.waitFor(() => {
      expect(mockInput.onmidimessage).toBeTypeOf('function');
    });

    // NoteOn 73
    mockInput.onmidimessage({
      data: new Uint8Array([0x90, 73, 100])
    } as any);

    expect(useMidiStore.getState().activeState.lastPlayedMidi).toBe(73);
    expect(useMidiStore.getState().uiState.activeKeys).toContain(73);
    expect(useMidiStore.getState().uiState.outputActiveKeys).toContain(73);
  });

  it('Phase 2 Checkpoint: Test Case 3 (Audible OFF)', async () => {
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
        keySwitches: [],
        selectedScaleIndex: 0,
        activeSwitchIndex: 0,
      },
      playStartSettings: {
        audible: false,
        rounded: false,
        octaveOffset: 0,
      },
      uiState: {
        ...useMidiStore.getState().uiState,
        activeKeys: [],
        outputActiveKeys: [],
      }
    });

    renderHook(() => useWebMidi());

    await vi.waitFor(() => {
      expect(mockInput.onmidimessage).toBeTypeOf('function');
    });

    // NoteOn 73
    mockInput.onmidimessage({
      data: new Uint8Array([0x90, 73, 100])
    } as any);

    expect(useMidiStore.getState().activeState.lastPlayedMidi).toBe(73);
    expect(useMidiStore.getState().uiState.activeKeys).toContain(73);
    expect(useMidiStore.getState().uiState.outputActiveKeys).not.toContain(73);
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

  it('Phase 1 Checkpoint: activeNotesRegistry simulation for NoteOn and NoteOff', async () => {
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
        scaleDecimalId: 2741, // C Major
        selectedScaleIndex: 0,
        activeSwitchIndex: 0,
        lastPlayedMidi: 60,
        keySwitches: [],
      },
      uiState: {
        ...useMidiStore.getState().uiState,
        activeKeys: [],
        outputActiveKeys: [],
      }
    });

    const mockLut = getLUT() || new Array(4096).fill(null);
    mockLut[2741] = {
      decimal: 2741,
      pitch_class_set: [0, 2, 4, 5, 7, 9, 11],
      scale_type: 'Major',
    } as any;
    setLUT(mockLut);

    renderHook(() => useWebMidi());

    await vi.waitFor(() => {
      expect(mockInput.onmidimessage).toBeTypeOf('function');
    });

    // Simulate Stepper Zone NoteOn (60 - C4). Calculated step offset should be 0.
    // executeScaleStep(0) from lastPlayedMidi(60) calculates 60.
    mockInput.onmidimessage({
      data: new Uint8Array([0x90, 60, 100])
    } as any);

    expect(useMidiStore.getState().uiState.outputActiveKeys).toContain(60);

    // Simulate Stepper Zone NoteOff (60)
    mockInput.onmidimessage({
      data: new Uint8Array([0x80, 60, 0])
    } as any);

    expect(useMidiStore.getState().uiState.outputActiveKeys).not.toContain(60);
  });

  it('Phase 1 Checkpoint: Test Case 1 - Given a mocked useMidiStore, When A0 (MIDI 21) Note On is fired, Assert triggerHomeReset is called BEFORE the store is queried again for lastPlayedMidi, and assert addOutputKey is called with the new root note', async () => {
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

    const callOrder: string[] = [];

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
        keySwitches: [],
        selectedScaleIndex: 0,
        activeSwitchIndex: 0,
      },
      homeSettings: {
        audible: true,
      },
      uiState: {
        ...useMidiStore.getState().uiState,
        activeKeys: [],
        outputActiveKeys: [],
      }
    });

    const originalGetState = useMidiStore.getState;
    const getStateSpy = vi.spyOn(useMidiStore, 'getState').mockImplementation(() => {
      callOrder.push('getState');
      return originalGetState();
    });

    const triggerHomeResetSpy = vi.spyOn(useMidiStore.getState(), 'triggerHomeReset').mockImplementation(() => {
      callOrder.push('triggerHomeReset');
      useMidiStore.setState((state) => ({
        activeState: {
          ...state.activeState,
          lastPlayedMidi: 48
        }
      }));
    });

    const addOutputKeySpy = vi.spyOn(useMidiStore.getState(), 'addOutputKey');

    renderHook(() => useWebMidi());

    await vi.waitFor(() => {
      expect(mockInput.onmidimessage).toBeTypeOf('function');
    });

    callOrder.length = 0;

    mockInput.onmidimessage({
      data: new Uint8Array([0x90, 21, 100])
    } as any);

    expect(triggerHomeResetSpy).toHaveBeenCalled();
    expect(addOutputKeySpy).toHaveBeenCalledWith(48);

    const firstTriggerIndex = callOrder.indexOf('triggerHomeReset');
    const subsequentGetStateIndex = callOrder.indexOf('getState', firstTriggerIndex + 1);
    expect(firstTriggerIndex).toBeGreaterThanOrEqual(0);
    expect(subsequentGetStateIndex).toBeGreaterThan(firstTriggerIndex);

    getStateSpy.mockRestore();
  });

  it('Phase 2 Checkpoint: Test Case 1 - Given a mocked activeNotesRegistry containing { 21: 60 }, When A0 (MIDI 21) Note Off is fired, Assert freshState.removeOutputKey(60) is explicitly called and the registry deletes the key 21', async () => {
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
        keySwitches: [],
        selectedScaleIndex: 0,
        activeSwitchIndex: 0,
      },
      homeSettings: {
        audible: true,
      },
      uiState: {
        ...useMidiStore.getState().uiState,
        activeKeys: [],
        outputActiveKeys: [],
      }
    });

    // Mock triggerHomeReset to set lastPlayedMidi to 60 consistently
    vi.spyOn(useMidiStore.getState(), 'triggerHomeReset').mockImplementation(() => {
      useMidiStore.setState((state) => ({
        activeState: {
          ...state.activeState,
          lastPlayedMidi: 60
        }
      }));
    });

    const removeOutputKeySpy = vi.spyOn(useMidiStore.getState(), 'removeOutputKey');
    const removeActiveKeySpy = vi.spyOn(useMidiStore.getState(), 'removeActiveKey');

    renderHook(() => useWebMidi());

    await vi.waitFor(() => {
      expect(mockInput.onmidimessage).toBeTypeOf('function');
    });

    // 1. Simulate Note On for MIDI 21 to populate activeNotesRegistry with { 21: 60 }
    mockInput.onmidimessage({
      data: new Uint8Array([0x90, 21, 100])
    } as any);

    // Reset spies to only record the Note Off events
    removeOutputKeySpy.mockClear();
    removeActiveKeySpy.mockClear();

    // 2. Fire Note Off for A0 (MIDI 21)
    mockInput.onmidimessage({
      data: new Uint8Array([0x80, 21, 0])
    } as any);

    // Assert freshState.removeOutputKey(60) is explicitly called
    expect(removeOutputKeySpy).toHaveBeenCalledWith(60);
    // Assert freshState.removeActiveKey(21) is called, but not 60
    expect(removeActiveKeySpy).not.toHaveBeenCalledWith(60);
    expect(removeActiveKeySpy).toHaveBeenCalledWith(21);

    // Clear spy history
    removeOutputKeySpy.mockClear();

    // 3. Fire Note Off for A0 again to assert the registry deleted key 21 (so no further removeOutputKey(60) is called)
    mockInput.onmidimessage({
      data: new Uint8Array([0x80, 21, 0])
    } as any);

    expect(removeOutputKeySpy).not.toHaveBeenCalled();
  });

  it('Phase 1 Checkpoint: Test Case 1 - Given a mocked store where filterRange is [36, 83] and filterMode is smart_wrap, When a Play/Start Note of 84 (C6) is received, Assert applyOutputFilter wraps it down and state.addOutputKey() is called with the wrapped note', async () => {
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

    useMidiStore.setState({
      globalSettings: {
        midiInPort: 'mock-input-1',
        power: true,
        channelFilter: 'ALL',
        startOctave: 4,
        roundPreference: 'UP',
        filterMode: 'smart_wrap',
        filterRange: [36, 83],
      },
      activeState: {
        rootNote: 0,
        scaleDecimalId: 2741,
        lastPlayedMidi: 60,
        keySwitches: [],
        selectedScaleIndex: 0,
        activeSwitchIndex: 0,
      },
      playStartSettings: {
        audible: true,
        rounded: false,
        octaveOffset: 0,
      },
      uiState: {
        ...useMidiStore.getState().uiState,
        activeKeys: [],
        outputActiveKeys: [],
      }
    });

    const addOutputKeySpy = vi.spyOn(useMidiStore.getState(), 'addOutputKey');
    const setLastPlayedMidiSpy = vi.spyOn(useMidiStore.getState(), 'setLastPlayedMidi');

    renderHook(() => useWebMidi());

    await vi.waitFor(() => {
      expect(mockInput.onmidimessage).toBeTypeOf('function');
    });

    // Send Play/Start Note 84 (C6)
    mockInput.onmidimessage({
      data: new Uint8Array([0x90, 84, 100])
    } as any);

    // C6 (84) smart_wrap in [36, 83] should wrap down to C2 (36)
    expect(setLastPlayedMidiSpy).toHaveBeenCalledWith(84);
    expect(addOutputKeySpy).toHaveBeenCalledWith(36);
    expect(useMidiStore.getState().uiState.activeKeys).toContain(84); // Physical key
    expect(useMidiStore.getState().uiState.activeKeys).not.toContain(36); // Target key
  });

  it('Phase 1 Checkpoint: Test Case 2 - Given applyOutputFilter returns null (dropped note), When a Play/Start Note is received, Assert state.addOutputKey and setLastPlayedMidi are NOT called, but state.addActiveKey(note) IS called for the physical key', async () => {
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

    useMidiStore.setState({
      globalSettings: {
        midiInPort: 'mock-input-1',
        power: true,
        channelFilter: 'ALL',
        startOctave: 4,
        roundPreference: 'UP',
        filterMode: 'octave_wrap',
        filterRange: [40, 45], // C is pitch class 0, not present in range 40-45 (which has PCs 4,5,6,7,8,9)
      },
      activeState: {
        rootNote: 0,
        scaleDecimalId: 2741,
        lastPlayedMidi: 60,
        keySwitches: [],
        selectedScaleIndex: 0,
        activeSwitchIndex: 0,
      },
      playStartSettings: {
        audible: true,
        rounded: false,
        octaveOffset: 0,
      },
      uiState: {
        ...useMidiStore.getState().uiState,
        activeKeys: [],
        outputActiveKeys: [],
      }
    });

    const addOutputKeySpy = vi.spyOn(useMidiStore.getState(), 'addOutputKey');
    const setLastPlayedMidiSpy = vi.spyOn(useMidiStore.getState(), 'setLastPlayedMidi');

    renderHook(() => useWebMidi());

    await vi.waitFor(() => {
      expect(mockInput.onmidimessage).toBeTypeOf('function');
    });

    // Send Play/Start Note 84 (C6)
    mockInput.onmidimessage({
      data: new Uint8Array([0x90, 84, 100])
    } as any);

    expect(setLastPlayedMidiSpy).toHaveBeenCalledWith(84);
    expect(addOutputKeySpy).not.toHaveBeenCalled();
    expect(useMidiStore.getState().uiState.activeKeys).toContain(84); // Physical key is still highlighted
    expect(useMidiStore.getState().uiState.activeKeys).not.toContain(72); // Wrapped key is NOT active since it was dropped
  });

  it('Phase 1 Checkpoint: Test Case 1 - Given a mocked store, When a Play/Start note is triggered with an octave offset of -2, Assert addActiveKey is ONLY called with the raw physical note, and NOT the shifted output note', async () => {
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
        keySwitches: [],
        selectedScaleIndex: 0,
        activeSwitchIndex: 0,
      },
      playStartSettings: {
        audible: true,
        rounded: false,
        octaveOffset: -2,
      },
      uiState: {
        ...useMidiStore.getState().uiState,
        activeKeys: [],
        outputActiveKeys: [],
      }
    });

    const addActiveKeySpy = vi.spyOn(useMidiStore.getState(), 'addActiveKey');
    const addOutputKeySpy = vi.spyOn(useMidiStore.getState(), 'addOutputKey');

    renderHook(() => useWebMidi());

    await vi.waitFor(() => {
      expect(mockInput.onmidimessage).toBeTypeOf('function');
    });

    // Send Play/Start Note 84 (C6). With offset -2 octaves (-24 MIDI values), target note is 60 (C4).
    mockInput.onmidimessage({
      data: new Uint8Array([0x90, 84, 100])
    } as any);

    // addActiveKey should be called with 84 (physical), but NOT 60 (shifted output)
    expect(addActiveKeySpy).toHaveBeenCalledWith(84);
    expect(addActiveKeySpy).not.toHaveBeenCalledWith(60);
    expect(addOutputKeySpy).toHaveBeenCalledWith(60);
  });

  it('Phase 2 Checkpoint: Test Case 1 - Given an active note in the registry, When Note Off fires for the Play/Start zone, Assert removeActiveKey is strictly called with the raw note, not the targetNote', async () => {
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
        keySwitches: [],
        selectedScaleIndex: 0,
        activeSwitchIndex: 0,
      },
      playStartSettings: {
        audible: true,
        rounded: false,
        octaveOffset: -2,
      },
      uiState: {
        ...useMidiStore.getState().uiState,
        activeKeys: [],
        outputActiveKeys: [],
      }
    });

    const removeActiveKeySpy = vi.spyOn(useMidiStore.getState(), 'removeActiveKey');
    const removeOutputKeySpy = vi.spyOn(useMidiStore.getState(), 'removeOutputKey');

    renderHook(() => useWebMidi());

    await vi.waitFor(() => {
      expect(mockInput.onmidimessage).toBeTypeOf('function');
    });

    // 1. Note On for MIDI 84 (C6), maps to target note 60 (C4)
    mockInput.onmidimessage({
      data: new Uint8Array([0x90, 84, 100])
    } as any);

    removeActiveKeySpy.mockClear();
    removeOutputKeySpy.mockClear();

    // 2. Note Off for MIDI 84 (C6)
    mockInput.onmidimessage({
      data: new Uint8Array([0x80, 84, 0])
    } as any);

    // removeActiveKey should be called with raw note 84, but NOT targetNote 60
    expect(removeActiveKeySpy).toHaveBeenCalledWith(84);
    expect(removeActiveKeySpy).not.toHaveBeenCalledWith(60);
    expect(removeOutputKeySpy).toHaveBeenCalledWith(60);
  });

  it('Phase 1 Checkpoint: Test Case 1 & 2 - Given activeNotesRegistry contains { 54: 62, 55: 62 }, When Note Off fires for key 54, Assert removeOutputKey(62) is NOT called and 54 is deleted. When Note Off fires for key 55, Assert removeOutputKey(62) IS called', async () => {
    vi.useFakeTimers();
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

    const mockLut = getLUT() || new Array(4096).fill(null);
    mockLut[2741] = {
      decimal: 2741,
      pitch_class_set: [0, 2, 4, 5, 7, 9, 11],
      scale_type: 'Major',
    } as any;
    setLUT(mockLut);

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
        lastPlayedMidi: 62,
        keySwitches: [],
        selectedScaleIndex: 0,
        activeSwitchIndex: 0,
        isFirstNote: true,
      },
      uiState: {
        activeKeys: [],
        outputActiveKeys: [],
        stepperInvertToggle: false,
        stepperInvertMomentary: false,
        stepperConfig: useMidiStore.getState().uiState.stepperConfig,
        stepperActiveNotes: {},
        lastStepperAction: null,
      }
    });

    const removeOutputKeySpy = vi.spyOn(useMidiStore.getState(), 'removeOutputKey');

    renderHook(() => useWebMidi());

    await vi.waitFor(() => {
      expect(mockInput.onmidimessage).toBeTypeOf('function');
    });

    // Send Note On for 54 (maps to 62 because isFirstNote is true and lastPlayedMidi is 62)
    mockInput.onmidimessage({
      data: new Uint8Array([0x90, 54, 100])
    } as any);

    // Reset isFirstNote to true so next trigger also returns 62
    useMidiStore.getState().setIsFirstNote(true);

    // Send Note On for 55 (maps to 62 because isFirstNote is true and lastPlayedMidi is 62)
    mockInput.onmidimessage({
      data: new Uint8Array([0x90, 55, 100])
    } as any);

    removeOutputKeySpy.mockClear();

    // Test Case 1: Note Off for 54. Target 62 should NOT be removed because 55 still holds it.
    mockInput.onmidimessage({
      data: new Uint8Array([0x80, 54, 0])
    } as any);

    expect(removeOutputKeySpy).not.toHaveBeenCalled();

    // Test Case 2: Note Off for 55. Target 62 should now be removed since no other physical key holds it.
    mockInput.onmidimessage({
      data: new Uint8Array([0x80, 55, 0])
    } as any);

    expect(removeOutputKeySpy).toHaveBeenCalledWith(62);

    vi.runAllTimers();
    vi.useRealTimers();
  });

  it('Phase 2 Checkpoint: Test Case 1 - Given an Output Filter range of C4-C5, When a Play/Start note of C2 is triggered, Assert setLastPlayedMidi updates to C2, even though addOutputKey is NOT called', async () => {
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

    useMidiStore.setState({
      globalSettings: {
        midiInPort: 'mock-input-1',
        power: true,
        channelFilter: 'ALL',
        startOctave: 4,
        roundPreference: 'UP',
        filterMode: 'drop' as any, // drop mode so it gets dropped
        filterRange: [60, 72], // C4-C5
      },
      activeState: {
        rootNote: 0,
        scaleDecimalId: 2741,
        lastPlayedMidi: 60,
        keySwitches: [],
        selectedScaleIndex: 0,
        activeSwitchIndex: 0,
      },
      playStartSettings: {
        audible: true,
        rounded: false,
        octaveOffset: -4, // so note 84 (C6) + (-4 * 12) = 36 (C2)
      },
      uiState: {
        ...useMidiStore.getState().uiState,
        activeKeys: [],
        outputActiveKeys: [],
      }
    });

    const addOutputKeySpy = vi.spyOn(useMidiStore.getState(), 'addOutputKey');
    const setLastPlayedMidiSpy = vi.spyOn(useMidiStore.getState(), 'setLastPlayedMidi');

    renderHook(() => useWebMidi());

    await vi.waitFor(() => {
      expect(mockInput.onmidimessage).toBeTypeOf('function');
    });

    // Send Note On for 84 (C6), maps to target note 36 (C2)
    mockInput.onmidimessage({
      data: new Uint8Array([0x90, 84, 100])
    } as any);

    expect(setLastPlayedMidiSpy).toHaveBeenCalledWith(36);
    expect(useMidiStore.getState().activeState.lastPlayedMidi).toBe(36);
    expect(addOutputKeySpy).not.toHaveBeenCalled();
  });

  it('Phase 4 Checkpoint: Test Case 1 - Pass MIDI note 48 (NoteOn) to the hook, verify processStepperAction is called with index 0', async () => {
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
        keySwitches: [],
        selectedScaleIndex: 0,
        activeSwitchIndex: 0,
      },
      uiState: {
        activeKeys: [],
        outputActiveKeys: [],
        stepperInvertToggle: false,
        stepperInvertMomentary: false,
        stepperConfig: useMidiStore.getState().uiState.stepperConfig,
        stepperActiveNotes: {},
        lastStepperAction: null,
      }
    });

    const processStepperActionSpy = vi.spyOn(useMidiStore.getState(), 'processStepperAction');

    renderHook(() => useWebMidi());

    await vi.waitFor(() => {
      expect(mockInput.onmidimessage).toBeTypeOf('function');
    });

    mockInput.onmidimessage({
      data: new Uint8Array([0x90, 48, 100])
    } as any);

    expect(processStepperActionSpy).toHaveBeenCalledWith(0, true, expect.any(Function));
  });

  it('Phase 2 Checkpoint: Test Case 1 - In useWebMidi.ts tests, simulate MIDI NoteOn 72. Assert it is routed to the Play/Start handler, NOT the Stepper handler', async () => {
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
        keySwitches: [],
        selectedScaleIndex: 0,
        activeSwitchIndex: 0,
      },
      playStartSettings: {
        audible: true,
        rounded: false,
        octaveOffset: 0,
      },
      uiState: {
        activeKeys: [],
        outputActiveKeys: [],
        stepperInvertToggle: false,
        stepperInvertMomentary: false,
        stepperConfig: useMidiStore.getState().uiState.stepperConfig,
        stepperActiveNotes: {},
        lastStepperAction: null,
      }
    });

    const processStepperActionSpy = vi.spyOn(useMidiStore.getState(), 'processStepperAction');

    renderHook(() => useWebMidi());

    await vi.waitFor(() => {
      expect(mockInput.onmidimessage).toBeTypeOf('function');
    });

    // NoteOn 72 (C5)
    mockInput.onmidimessage({
      data: new Uint8Array([0x90, 72, 100])
    } as any);

    // It should NOT call the stepper handler
    expect(processStepperActionSpy).not.toHaveBeenCalled();

    // It should route to Play/Start Note zone:
    expect(useMidiStore.getState().activeState.lastPlayedMidi).toBe(72);
    expect(useMidiStore.getState().uiState.activeKeys).toContain(72);
    expect(useMidiStore.getState().uiState.outputActiveKeys).toContain(72);

    processStepperActionSpy.mockRestore();
  });

  it('Phase 2 - Test Case 1: Given size = 49, simulate NoteOn 60. Assert processStepperAction is called with index 12', async () => {
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

    useMidiStore.setState({
      globalSettings: {
        midiInPort: 'mock-input-1',
        power: true,
        channelFilter: 'ALL',
        startOctave: 4,
        roundPreference: 'UP',
        filterMode: 'octave_wrap',
        filterRange: [21, 108],
        inputKeyboardSize: 49,
      },
      activeState: {
        rootNote: 0,
        scaleDecimalId: 2741,
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

    const processStepperActionSpy = vi.spyOn(useMidiStore.getState(), 'processStepperAction');

    renderHook(() => useWebMidi());

    await vi.waitFor(() => {
      expect(mockInput.onmidimessage).toBeTypeOf('function');
    });

    // NoteOn 60
    mockInput.onmidimessage({
      data: new Uint8Array([0x90, 60, 100])
    } as any);

    expect(processStepperActionSpy).toHaveBeenCalledWith(12, true, expect.any(Function));
    processStepperActionSpy.mockRestore();
  });

  it('Phase 2 - Test Case 2: Given size = 49, simulate NoteOn 48. Assert it routes to the Scale Select logic', async () => {
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

    useMidiStore.setState({
      globalSettings: {
        midiInPort: 'mock-input-1',
        power: true,
        channelFilter: 'ALL',
        startOctave: 4,
        roundPreference: 'UP',
        filterMode: 'octave_wrap',
        filterRange: [21, 108],
        inputKeyboardSize: 49,
      },
      activeState: {
        rootNote: 0,
        scaleDecimalId: 2741,
        lastPlayedMidi: 60,
        keySwitches: [
          { root: 'C', type: 'Major' },
        ],
        selectedScaleIndex: 0,
        activeSwitchIndex: 0,
      },
      uiState: {
        ...useMidiStore.getState().uiState,
        activeKeys: [],
        outputActiveKeys: [],
      }
    });

    const setActiveStateSpy = vi.spyOn(useMidiStore.getState(), 'setActiveState');

    renderHook(() => useWebMidi());

    await vi.waitFor(() => {
      expect(mockInput.onmidimessage).toBeTypeOf('function');
    });

    // NoteOn 48 is C3. In 49-key mode, Scale Select is 48-59.
    // Index for scale key switches is note - 48 (index 0).
    mockInput.onmidimessage({
      data: new Uint8Array([0x90, 48, 100])
    } as any);

    expect(setActiveStateSpy).toHaveBeenCalled();
    setActiveStateSpy.mockRestore();
  });
});
