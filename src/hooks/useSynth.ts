import { useEffect, useRef } from 'react';
import { useMidiStore } from '../store/useMidiStore';

export function useSynth() {
  const outputActiveKeys = useMidiStore((state) => state.uiState.outputActiveKeys);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const activeNodesRef = useRef<Record<number, { osc: OscillatorNode; gain: GainNode }>>({});

  // Lazily initialize AudioContext on user interaction
  const initAudio = () => {
    if (!audioCtxRef.current) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        audioCtxRef.current = new AudioCtx();
      }
    }
    if (audioCtxRef.current && audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }
  };

  useEffect(() => {
    const handleInteraction = () => {
      initAudio();
      if (audioCtxRef.current && audioCtxRef.current.state === 'running') {
        window.removeEventListener('pointerdown', handleInteraction);
        window.removeEventListener('keydown', handleInteraction);
      }
    };
    window.addEventListener('pointerdown', handleInteraction);
    window.addEventListener('keydown', handleInteraction);
    return () => {
      window.removeEventListener('pointerdown', handleInteraction);
      window.removeEventListener('keydown', handleInteraction);
    };
  }, []);

  useEffect(() => {
    if (!audioCtxRef.current) return;
    const ctx = audioCtxRef.current;
    const activeNodes = activeNodesRef.current;

    // Determine notes to start
    for (const note of outputActiveKeys) {
      if (!activeNodes[note]) {
        // Init if context is suspended
        if (ctx.state === 'suspended') {
          ctx.resume();
        }

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        // Convert MIDI note to frequency
        const freq = 440 * Math.pow(2, (note - 69) / 12);
        osc.frequency.setValueAtTime(freq, ctx.currentTime);
        osc.type = 'triangle'; // Smooth, warm tone

        // Set gain envelope
        gain.gain.setValueAtTime(0, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.15, ctx.currentTime + 0.02); // 15% volume, quick attack

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start();

        activeNodes[note] = { osc, gain };
      }
    }

    // Determine notes to stop
    for (const noteStr in activeNodes) {
      const note = parseInt(noteStr, 10);
      if (!outputActiveKeys.includes(note)) {
        const { osc, gain } = activeNodes[note];
        
        // Release envelope
        gain.gain.setValueAtTime(gain.gain.value, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.08); // 80ms release

        osc.stop(ctx.currentTime + 0.08);
        delete activeNodes[note];
      }
    }
  }, [outputActiveKeys]);
}
