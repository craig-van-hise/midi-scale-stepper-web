import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useMidiStore } from '../store/useMidiStore';
import { getLUT } from '../utils/lutRegistry';
import { spellByInterval, getScaleRootName } from '../utils/scaleSpeller';
import { calculateBitmaskDecimal } from '../utils/BitmaskCalculator';

const STAFF_SPACE = 9;
const MIDDLE_LINE_STEP = 6; // B4
const NOTE_COLOR = '#FACC15';
const SELECTED_COLOR = '#a855f7';

/**
 * ScaleInspectorNotation
 * A highly deterministic musical scale visualizer.
 * Uses inline styles to ensure exact positioning independent of external CSS frameworks.
 */
export const ScaleInspectorNotation: React.FC = () => {
  // Subscribe to lutReady so this component re-renders once the LUT finishes loading
  const lutReady = useMidiStore((state) => state.lutReady);
  
  // Get active states from Zustand
  const rootNote = useMidiStore((state) => state.activeState.rootNote);
  const scaleDecimalId = useMidiStore((state) => state.activeState.scaleDecimalId);
  const lastPlayedMidi = useMidiStore((state) => state.activeState.lastPlayedMidi);

  // 1. Initialize state
  const [pitches, setPitches] = useState<number[]>([60, 62, 64, 65, 67, 69, 71]);
  const [selectedIndices, setSelectedIndices] = useState<Set<number>>(new Set());
  const [lastSelectedIndex, setLastSelectedIndex] = useState<number | null>(null);

  // Sync with store active scale
  useEffect(() => {
    const lut = getLUT();
    if (!lut || !lutReady || scaleDecimalId === null) return;
    const entry = lut[scaleDecimalId];
    if (!entry) return;

    const rootMidi = 60 + (rootNote ?? 0);
    // Generate pitches: LUT pitch_class_set is zero-normalized, just offset by rootMidi
    const newPitches = entry.pitch_class_set.map((pc: number) => {
      return rootMidi + pc;
    }).sort((a: number, b: number) => a - b);

    // Only update if pitches actually differ to avoid loops
    const matches = pitches.length === newPitches.length && pitches.every((p, i) => p === newPitches[i]);
    if (!matches) {
      setPitches(newPitches);
    }
  }, [scaleDecimalId, rootNote, lutReady, pitches]);

  // Highlight last played MIDI note
  useEffect(() => {
    if (lastPlayedMidi === null) {
      setSelectedIndices(new Set());
      setLastSelectedIndex(null);
      return;
    }

    const lastPlayedPC = lastPlayedMidi % 12;
    const idx = pitches.findIndex((p) => p % 12 === lastPlayedPC);
    if (idx !== -1) {
      setSelectedIndices(new Set([idx]));
      setLastSelectedIndex(idx);
    }
  }, [lastPlayedMidi, pitches]);

  // 2. Memoized hook for scale data
  const scaleData = useMemo(() => {
    if (pitches.length === 0) return null;
    const lut = getLUT();

    const root = Math.min(...pitches);
    const pcs = pitches.map(p => (p - root + 12) % 12);
    const bitmask = calculateBitmaskDecimal(pcs);
    
    const entry = lut ? lut[bitmask] : null;
    const rootName = getScaleRootName(root, entry);

    const notes = pitches.map((pitch, i) => {
      const intervalStr = entry?.scale_intervals?.[i] || '1';
      const { stepOffset, accidental, noteName } = spellByInterval(
        pitch, 
        root, 
        rootName, 
        intervalStr
      );

      return {
        id: `${pitch}-${i}`,
        pitch,
        spelling: noteName,
        stepOffset,
        accidental,
      };
    });

    return {
      entry,
      bitmask,
      rootName,
      notes,
    };
  }, [pitches, lutReady]);

  // 3. Selection Handlers
  const handleNoteClick = useCallback((index: number, event: React.MouseEvent) => {
    event.stopPropagation();
    const newSelection = new Set(selectedIndices);

    if (event.shiftKey && lastSelectedIndex !== null) {
      const start = Math.min(lastSelectedIndex, index);
      const end = Math.max(lastSelectedIndex, index);
      for (let i = start; i <= end; i++) {
        newSelection.add(i);
      }
    } else if (event.metaKey || event.ctrlKey) {
      if (newSelection.has(index)) newSelection.delete(index);
      else newSelection.add(index);
    } else {
      newSelection.clear();
      newSelection.add(index);
    }

    setSelectedIndices(newSelection);
    setLastSelectedIndex(index);
  }, [selectedIndices, lastSelectedIndex]);

  // Mutation Logic
  const mutateSelected = useCallback((delta: number) => {
    setPitches(prev => {
      // 1. Calculate proposed state
      let proposedPitches = prev.map((p, i) => selectedIndices.has(i) ? p + delta : p);

      // 2. Octave Wrap Algorithm
      // Confine root (index 0) to C4-B4 (60-71)
      if (proposedPitches[0] > 71) {
        proposedPitches = proposedPitches.map(p => p - 12);
      } else if (proposedPitches[0] < 60) {
        proposedPitches = proposedPitches.map(p => p + 12);
      }

      // 3. Validate: Monotonicity (Strictly Ascending)
      const isMonotonic = proposedPitches.every((p, i, arr) => i === 0 || p > arr[i - 1]);
      if (!isMonotonic) return prev;

      // 4. Validate: Relative Octave Span (Top - Root <= 11)
      const rootPitch = proposedPitches[0];
      const topPitch = proposedPitches[proposedPitches.length - 1];
      if (topPitch - rootPitch > 11) return prev;

      // 5. Validate: Global Bounds (0-127) - Safety check
      if (rootPitch < 0 || topPitch > 127) return prev;

      // Sync proposed pitches to Zustand store immediately (zero-normalize to PCS first)
      const rootP = proposedPitches[0];
      const pcs = proposedPitches.map(p => (p - rootP + 12) % 12);
      const newDecimal = calculateBitmaskDecimal(pcs);
      const newRootNote = rootPitch - 60;
      useMidiStore.setState((state) => ({
        activeState: {
          ...state.activeState,
          scaleDecimalId: newDecimal,
          rootNote: newRootNote,
        },
      }));

      return proposedPitches;
    });
  }, [selectedIndices]);

  const deleteSelected = useCallback(() => {
    if (pitches.length <= 2) return;
    const next = pitches.filter((_, i) => !selectedIndices.has(i));
    if (next.length >= 2) {
        setPitches(next);
        setSelectedIndices(new Set());
        setLastSelectedIndex(null);

        // Sync to Zustand store immediately (zero-normalize to PCS first)
        const rootP = next[0];
        const pcs = next.map(p => (p - rootP + 12) % 12);
        const newDecimal = calculateBitmaskDecimal(pcs);
        const newRootNote = next[0] - 60;
        useMidiStore.setState((state) => ({
          activeState: {
            ...state.activeState,
            scaleDecimalId: newDecimal,
            rootNote: newRootNote,
          },
        }));
    }
  }, [pitches, selectedIndices]);

  const clearSelection = useCallback(() => {
    setSelectedIndices(new Set());
    setLastSelectedIndex(null);
  }, []);

  const containerRef = React.useRef<HTMLDivElement>(null);

  const insertNoteMidway = useCallback((event: React.MouseEvent) => {
    if (pitches.length >= 12 || !containerRef.current) return;
    
    const clickX = event.clientX;
    const noteElements = Array.from(containerRef.current.querySelectorAll('[data-pitch-index]'));
    
    let leftIdx = -1;
    let rightIdx = -1;
    
    for (let i = 0; i < noteElements.length; i++) {
        const rect = noteElements[i].getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        if (centerX < clickX) {
            leftIdx = i;
        } else if (rightIdx === -1) {
            rightIdx = i;
            break;
        }
    }
    
    if (leftIdx !== -1 && rightIdx !== -1) {
        const pLeft = pitches[leftIdx];
        const pRight = pitches[rightIdx];
        if (pRight - pLeft > 1) {
            const newPitch = Math.floor((pLeft + pRight) / 2);
            
            // Transactional Validation for Insertion
            const proposedPitches = [...pitches];
            proposedPitches.splice(rightIdx, 0, newPitch);

            const rootPitch = proposedPitches[0];
            const topPitch = proposedPitches[proposedPitches.length - 1];
            
            // 1. Root Boundary Check (C4-B4)
            if (rootPitch < 60 || rootPitch > 71) return;

            // 2. Relative Octave Span Check
            if (topPitch - rootPitch <= 11) {
                setPitches(proposedPitches);
                setSelectedIndices(new Set([rightIdx]));
                setLastSelectedIndex(rightIdx);

                // Sync to Zustand store immediately (zero-normalize to PCS first)
                const rootP = proposedPitches[0];
                const pcs = proposedPitches.map(p => (p - rootP + 12) % 12);
                const newDecimal = calculateBitmaskDecimal(pcs);
                const newRootNote = rootPitch - 60;
                useMidiStore.setState((state) => ({
                  activeState: {
                    ...state.activeState,
                    scaleDecimalId: newDecimal,
                    rootNote: newRootNote,
                  },
                }));
            }
        }
    }
  }, [pitches]);

  // 5. Global Keyboard Listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (selectedIndices.size === 0) return;

      if (e.key === 'ArrowUp') {
        e.preventDefault();
        mutateSelected(1);
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        mutateSelected(-1);
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        const minIdx = Math.min(...Array.from(selectedIndices));
        const next = Math.max(0, minIdx - 1);
        setSelectedIndices(new Set([next]));
        setLastSelectedIndex(next);
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        const maxIdx = Math.max(...Array.from(selectedIndices));
        const next = Math.min(pitches.length - 1, maxIdx + 1);
        setSelectedIndices(new Set([next]));
        setLastSelectedIndex(next);
      } else if (e.key === 'Escape') {
        e.preventDefault();
        clearSelection();
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        deleteSelected();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedIndices, mutateSelected, deleteSelected]);

  const lines = [2, 1, 0, -1, -2]; 

  const containerStyle: React.CSSProperties = {
    width: '1020px',
    backgroundColor: '#ffffff',
    color: '#0f172a',
    borderRadius: '0.75rem',
    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.15)',
    overflow: 'hidden',
    border: '1px solid #cbd5e1',
    fontFamily: 'sans-serif',
    padding: '0.5rem 1rem',
    userSelect: 'none',
    WebkitUserSelect: 'none',
  };

  const canvasStyle: React.CSSProperties = {
    height: '120px',
    width: '100%',
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: '#ffffff',
    borderRadius: '0.5rem',
  };


  const staffHeight = 4 * STAFF_SPACE;
  const staffWrapperStyle: React.CSSProperties = {
    position: 'absolute',
    top: '50%',
    left: '24px',
    right: '24px',
    height: `${staffHeight}px`,
    transform: 'translateY(-50%)',
    borderLeft: '1px solid #0f172a',
    borderRight: '1px solid #0f172a',
    pointerEvents: 'none',
  };

  const staffLineStyle = (multiplier: number): React.CSSProperties => ({
    position: 'absolute',
    width: '100%',
    height: '1px',
    backgroundColor: '#0f172a',
    top: multiplier === 0 
      ? '50%' 
      : `calc(50% ${multiplier > 0 ? '+' : '-'} ${Math.abs(multiplier * STAFF_SPACE)}px)`,
  });

  const clefStyle: React.CSSProperties = {
    position: 'absolute',
    fontFamily: 'Bravura, serif',
    fontSize: `${STAFF_SPACE * 4}px`,
    top: `calc(50% + ${1 * STAFF_SPACE}px)`, // Anchored to L2 (G-line)
    left: '32px',
    lineHeight: 0,
    color: '#0f172a',
    userSelect: 'none',
    pointerEvents: 'none',
  };

  return (
    <div 
        style={containerStyle} 
        className="scale-inspector-container"
        onClick={clearSelection}
    >
      {/* Scale Name Header */}
      <div style={{ 
        textAlign: 'center', 
        fontSize: '1.25rem', 
        fontWeight: 'bold',
        color: '#0f172a'
      }}>
        {scaleData?.rootName} {scaleData?.entry?.scale_type || 'Unknown Scale'}
      </div>

      <div style={canvasStyle}>
        {/* Staff Wrapper with Barlines */}
        <div style={staffWrapperStyle}>
          {lines.map((multiplier, i) => (
            <div
              key={i}
              data-testid="staff-line"
              style={staffLineStyle(multiplier)}
            />
          ))}
        </div>

        {/* Treble Clef */}
        <div style={clefStyle} className="smufl">
          {'\uE050'}
        </div>

        {/* Notes Container */}
        <div
          ref={containerRef}
          onDoubleClick={insertNoteMidway}
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            justifyContent: 'space-evenly',
            paddingLeft: '68px', // Space for Clef
            paddingRight: '48px',
          }}
        >
          {scaleData?.notes.map((note, index) => {
            const isSelected = selectedIndices.has(index);
            const verticalOffsetSteps = note.stepOffset - MIDDLE_LINE_STEP;
            const topPosition = `calc(50% - ${verticalOffsetSteps * (STAFF_SPACE / 2)}px)`;
            
            const ledgerLines = [];
            if (note.stepOffset <= 0) { 
              for (let s = 0; s >= note.stepOffset; s -= 2) {
                ledgerLines.push(s);
              }
            } else if (note.stepOffset >= 12) { 
              for (let s = 12; s <= note.stepOffset; s += 2) {
                ledgerLines.push(s);
              }
            }

            return (
              <div
                key={note.id}
                data-pitch-index={index}
                style={{
                  position: 'relative',
                  width: '30px',
                  height: '100%',
                }}
              >
                {/* Interval Label (Above) */}
                <div style={{
                  position: 'absolute',
                  top: `calc(50% - ${4.5 * STAFF_SPACE}px)`,
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  fontSize: '0.875rem',
                  fontWeight: 'bold',
                  color: '#475569',
                  fontFamily: 'monospace',
                  whiteSpace: 'nowrap',
                  pointerEvents: 'none',
                }}>
                  {scaleData?.entry?.scale_intervals?.[index] || '-'}
                </div>

                {/* Note Name Label (Below) */}
                <div style={{
                  position: 'absolute',
                  top: `calc(50% + ${5.5 * STAFF_SPACE}px)`,
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  fontSize: '1rem',
                  fontWeight: 'bold',
                  color: '#0f172a',
                  pointerEvents: 'none',
                }}
                data-testid="note-name-label"
              >
                {note.spelling}
              </div>

                {/* Ledger Lines */}
                {ledgerLines.map((s) => (
                  <div
                    key={s}
                    style={{
                      position: 'absolute',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      width: '24px',
                      height: '1px',
                      backgroundColor: '#0f172a',
                      top: `calc(50% - ${(s - MIDDLE_LINE_STEP) * (STAFF_SPACE / 2)}px)`,
                    }}
                  />
                ))}

                {/* Accidental */}
                {note.accidental && (
                  <div
                    className="smufl"
                    style={{
                      position: 'absolute',
                      left: `${0 * STAFF_SPACE}px`,
                      top: topPosition,
                      transform: 'translateY(-50%)',
                      fontSize: `${STAFF_SPACE * 2.75}px`,
                      color: isSelected ? SELECTED_COLOR : NOTE_COLOR,
                      lineHeight: 0,
                      fontFamily: 'Bravura, serif',
                    }}
                  >
                    {note.accidental}
                  </div>
                )}

                {/* Notehead */}
                <div
                  className="smufl"
                  style={{
                    position: 'absolute',
                    left: '50%',
                    top: topPosition,
                    transform: 'translate(-50%, calc(-50% + 0.5px))',
                    fontSize: `${STAFF_SPACE * 4.44}px`,
                    color: isSelected ? SELECTED_COLOR : NOTE_COLOR,
                    lineHeight: 0,
                    cursor: 'pointer',
                    fontFamily: 'Bravura, serif',
                  }}
                  data-testid="notehead"
                  onClick={(e) => handleNoteClick(index, e)}
                >
                  {'\uE0A4'}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
