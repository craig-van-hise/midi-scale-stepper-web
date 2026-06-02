import { useEffect, useRef, useState } from 'react';
import { useMidiStore } from '../store/useMidiStore';
import { calculateBitmaskDecimal } from '../utils/BitmaskCalculator';
import { STANDARD_PITCH_CLASSES, NOTE_TO_PC } from '../components/ScaleKeySwitches12';
import { executeScaleStep, applyOutputFilter } from '../utils/ScaleStepperEngine';
import { roundNote, calculateDynamicStepOffset } from '../utils/RoundingEngine';

export function useWebMidi() {
  const [midiAccess, setMidiAccess] = useState<MIDIAccess | null>(null);
  const [inputs, setInputs] = useState<MIDIInput[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const activeNotesRegistry = useRef(new Map<number, number>());

  const midiInPort = useMidiStore((state) => state.globalSettings.midiInPort);
  const channelFilter = useMidiStore((state) => state.globalSettings.channelFilter);
  const setMidiInPort = useMidiStore((state) => state.setMidiInPort);

  // References to keep callbacks and state fresh inside event handlers
  const channelFilterRef = useRef(channelFilter);
  useEffect(() => {
    channelFilterRef.current = channelFilter;
  }, [channelFilter]);

  useEffect(() => {
    let isMounted = true;

    async function initMidi() {
      if (typeof navigator === 'undefined' || !navigator.requestMIDIAccess) {
        setError('Web MIDI API is not supported in this browser.');
        setLoading(false);
        return;
      }

      try {
        const access = await navigator.requestMIDIAccess();
        if (!isMounted) return;
        setMidiAccess(access);
        setLoading(false);

        // Update list of inputs
        const updateInputs = () => {
          const list = Array.from(access.inputs.values());
          setInputs(list);
          
          // Auto-select first input if none selected or the selected one was disconnected
          const currentPortId = useMidiStore.getState().globalSettings.midiInPort;
          if (list.length > 0) {
            if (!currentPortId || !list.some(input => input.id === currentPortId)) {
              setMidiInPort(list[0].id);
            }
          } else if (currentPortId) {
            setMidiInPort(null);
          }
        };

        updateInputs();
        access.onstatechange = () => {
          if (isMounted) updateInputs();
        };

      } catch (err: any) {
        if (isMounted) {
          setError(err?.message || 'Failed to access MIDI devices.');
          setLoading(false);
        }
      }
    }

    initMidi();

    return () => {
      isMounted = false;
    };
  }, [setMidiInPort]);

  // Hook up event listener to the selected input port
  useEffect(() => {
    if (!midiAccess || !midiInPort) return;

    const input = midiAccess.inputs.get(midiInPort);
    if (!input) return;

    const handleMidiMessage = (event: MIDIMessageEvent) => {
      if (!event.data) return;
      
      const power = useMidiStore.getState().globalSettings.power;
      if (!power) return;
      
      const [status, note, velocity] = event.data;
      const command = status & 0xF0;
      const channel = status & 0x0F; // 0-15 corresponding to channels 1-16

      // Filter by channel if not 'ALL'
      const currentFilter = channelFilterRef.current;
      if (currentFilter !== 'ALL' && channel !== currentFilter) {
        return;
      }

      // Note On
      if (command === 0x90 && velocity > 0) {
        // 1. Home Zone Intercept: 21 - 23 (A0 - B0)
        // If exactly 21 (A0), call triggerHomeReset(). Drop all notes in this zone.
        if (note >= 21 && note <= 23) {
          if (note === 21) {
            // 1. Trigger the mutation
            useMidiStore.getState().triggerHomeReset();
            
            // 2. Fetch a FRESH snapshot post-mutation
            const freshState = useMidiStore.getState();
            const homeNote = freshState.activeState.lastPlayedMidi;
            
            // 3. Route the correct, fresh note
            if (homeNote !== null && freshState.homeSettings?.audible) {
              freshState.addOutputKey(homeNote);
              activeNotesRegistry.current.set(note, homeNote);
            }
          }
          useMidiStore.getState().addActiveKey(note);
          return;
        }
        
        // 2. Root Select Zone: 24 - 35 (C1 - B1)
        if (note >= 24 && note <= 35) {
          const rootNote = note - 24;
          useMidiStore.getState().setRootNote(rootNote);
          return;
        }

        // 3. Scale Select Zone: 36 - 47 (C2 - B2)
        if (note >= 36 && note <= 47) {
          const switchIndex = note - 36;
          const activeState = useMidiStore.getState().activeState;
          const scaleObj = activeState.keySwitches[switchIndex];
          if (scaleObj) {
            const pcs = STANDARD_PITCH_CLASSES[scaleObj.type] || STANDARD_PITCH_CLASSES['Major'];
            const decimal = calculateBitmaskDecimal(pcs);
            const rootPC = NOTE_TO_PC[scaleObj.root] ?? 0;
            useMidiStore.getState().setActiveState({
              ...activeState,
              activeSwitchIndex: switchIndex,
              scaleDecimalId: decimal,
              rootNote: rootPC
            });
          }
          return;
        }

        // 4. Stepper Zone: 48 - 71 (C3 - B4)
        if (note >= 48 && note <= 71) {
          const index = note - 48;
          useMidiStore.getState().processStepperAction(index, true, executeScaleStep);
          return;
        }

        // 5. Play/Start Note Zone: 73 - 108 (C#5 - C8)
        if (note >= 73 && note <= 108) {
          const state = useMidiStore.getState();
          const { rounded, audible, octaveOffset } = state.playStartSettings;
          const { filterMode, filterRange } = state.globalSettings;
          
          const rawNote = Math.max(0, Math.min(127, note + ((octaveOffset ?? 0) * 12)));
          const roundedNote = roundNote(
            rawNote,
            state.activeState.scaleDecimalId,
            state.globalSettings.roundPreference
          );
          const targetNote = rounded ? roundedNote : rawNote;
          
          // 1. ALWAYS set anchor and registry FIRST
          state.setLastPlayedMidi(targetNote);
          activeNotesRegistry.current.set(note, targetNote);
          
          // 2. Apply Output Filter
          const finalTargetNote = applyOutputFilter(targetNote, filterMode, filterRange[0], filterRange[1]);
          
          // 3. Route to Output
          if (finalTargetNote !== null && audible) {
            state.addOutputKey(finalTargetNote);
          }
          
          // Always highlight the actual physical key pressed on the input UI
          state.addActiveKey(note);
          return;
        }

        useMidiStore.getState().addActiveKey(note);
      }
      // Note Off
      else if (command === 0x80 || (command === 0x90 && velocity === 0)) {
        if (note >= 21 && note <= 23) {
          const freshState = useMidiStore.getState();
          freshState.removeActiveKey(note);
          
          const targetNote = activeNotesRegistry.current.get(note);
          if (targetNote !== undefined) {
            let isHeldByAnother = false;
            activeNotesRegistry.current.forEach((val, key) => {
              if (key !== note && val === targetNote) {
                isHeldByAnother = true;
              }
            });

            if (!isHeldByAnother) {
              freshState.removeOutputKey(targetNote);
            }
            activeNotesRegistry.current.delete(note);
          }
          return;
        }
        if (note >= 24 && note <= 35) {
          return;
        }
        if (note >= 36 && note <= 47) {
          return;
        }
        if (note >= 48 && note <= 71) {
          const index = note - 48;
          useMidiStore.getState().processStepperAction(index, false);
          return;
        }
        if (note >= 73 && note <= 108) {
          const targetNote = activeNotesRegistry.current.get(note);
          const freshState = useMidiStore.getState();
          if (targetNote !== undefined) {
            let isHeldByAnother = false;
            activeNotesRegistry.current.forEach((val, key) => {
              if (key !== note && val === targetNote) {
                isHeldByAnother = true;
              }
            });

            const { audible } = freshState.playStartSettings;
            if (!isHeldByAnother && audible) {
              freshState.removeOutputKey(targetNote);
            }
            activeNotesRegistry.current.delete(note);
          }
          freshState.removeActiveKey(note);
          return;
        }

        useMidiStore.getState().removeActiveKey(note);
      }
    };

    input.onmidimessage = handleMidiMessage;

    return () => {
      input.onmidimessage = null;
    };
  }, [midiAccess, midiInPort]);

  // Forward outputActiveKeys to all connected MIDI output devices
  const outputActiveKeys = useMidiStore((state) => state.uiState.outputActiveKeys);
  const prevOutputKeysRef = useRef<number[]>([]);

  useEffect(() => {
    if (!midiAccess) return;

    const prevKeys = prevOutputKeysRef.current;
    const added = outputActiveKeys.filter(k => !prevKeys.includes(k));
    const removed = prevKeys.filter(k => !outputActiveKeys.includes(k));

    const outputs = Array.from(midiAccess.outputs.values());

    for (const note of added) {
      for (const output of outputs) {
        try {
          output.send([0x90, note, 100]); // Note On, Channel 1, Velocity 100
        } catch (e) {
          // Ignore write errors to disconnected/unauthorized devices
        }
      }
    }

    for (const note of removed) {
      for (const output of outputs) {
        try {
          output.send([0x80, note, 0]); // Note Off, Channel 1
        } catch (e) {
          // Ignore write errors
        }
      }
    }

    prevOutputKeysRef.current = outputActiveKeys;
  }, [midiAccess, outputActiveKeys]);

  return { midiAccess, inputs, error, loading };
}
