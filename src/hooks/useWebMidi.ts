import { useEffect, useRef, useState } from 'react';
import { useMidiStore } from '../store/useMidiStore';
import { calculateBitmaskDecimal } from '../utils/BitmaskCalculator';
import { STANDARD_PITCH_CLASSES, NOTE_TO_PC } from '../components/ScaleKeySwitches12';
import { STEPPER_DATA_MAP } from '../components/ScaleStepperKeySwitches25';
import { executeScaleStep } from '../utils/ScaleStepperEngine';

export function useWebMidi() {
  const [midiAccess, setMidiAccess] = useState<MIDIAccess | null>(null);
  const [inputs, setInputs] = useState<MIDIInput[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const midiInPort = useMidiStore((state) => state.globalSettings.midiInPort);
  const channelFilter = useMidiStore((state) => state.globalSettings.channelFilter);
  const setMidiInPort = useMidiStore((state) => state.setMidiInPort);
  const addActiveKey = useMidiStore((state) => state.addActiveKey);
  const removeActiveKey = useMidiStore((state) => state.removeActiveKey);

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
        if (note >= 48 && note <= 59) {
          const switchIndex = note - 48;
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
        if (note >= 60 && note <= 84) {
          const mapIndex = note - 60;
          const mappedData = STEPPER_DATA_MAP[mapIndex];
          if (mappedData) {
            const stepOffset = parseInt(mappedData.index, 10);
            executeScaleStep(stepOffset);
          }
          addActiveKey(note);
          return;
        }
        addActiveKey(note);
      }
      // Note Off
      else if (command === 0x80 || (command === 0x90 && velocity === 0)) {
        if (note >= 48 && note <= 59) {
          return;
        }
        if (note >= 60 && note <= 84) {
          removeActiveKey(note);
          const { lastPlayedMidi } = useMidiStore.getState().activeState;
          if (lastPlayedMidi !== null) {
            useMidiStore.getState().removeOutputKey(lastPlayedMidi);
          }
          return;
        }
        removeActiveKey(note);
      }
    };

    input.onmidimessage = handleMidiMessage;

    return () => {
      input.onmidimessage = null;
    };
  }, [midiAccess, midiInPort, addActiveKey, removeActiveKey]);

  return { midiAccess, inputs, error, loading };
}
