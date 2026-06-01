import { useState, useEffect, useRef } from 'react';
import React from 'react';
import { useMidiStore } from '../store/useMidiStore';
import { executeScaleStep } from '../utils/ScaleStepperEngine';
import { calculateDynamicStepOffset } from '../utils/RoundingEngine';

export interface StepperData {
  noteName: string;
  isBlack: boolean;
}

export const STEPPER_DATA_MAP: StepperData[] = [
  { noteName: 'C3', isBlack: false },
  { noteName: 'Db3', isBlack: true },
  { noteName: 'D3', isBlack: false },
  { noteName: 'Eb3', isBlack: true },
  { noteName: 'E3', isBlack: false },
  { noteName: 'F3', isBlack: false },
  { noteName: 'Gb3', isBlack: true },
  { noteName: 'G3', isBlack: false },
  { noteName: 'Ab3', isBlack: true },
  { noteName: 'A3', isBlack: false },
  { noteName: 'Bb3', isBlack: true },
  { noteName: 'B3', isBlack: false },
  { noteName: 'C4', isBlack: false },
  { noteName: 'Db4', isBlack: true },
  { noteName: 'D4', isBlack: false },
  { noteName: 'Eb4', isBlack: true },
  { noteName: 'E4', isBlack: false },
  { noteName: 'F4', isBlack: false },
  { noteName: 'Gb4', isBlack: true },
  { noteName: 'G4', isBlack: false },
  { noteName: 'Ab4', isBlack: true },
  { noteName: 'A4', isBlack: false },
  { noteName: 'Bb4', isBlack: true },
  { noteName: 'B4', isBlack: false },
  { noteName: 'C5', isBlack: false }
];

const containerStyle: React.CSSProperties = { 
  display: 'flex', 
  width: '607.5px', 
  position: 'relative', 
  overflow: 'visible', 
  fontFamily: "'Roboto Mono', monospace" 
};

const getWhiteStyle = (isSelected: boolean): React.CSSProperties => ({
  width: '40.5px',
  height: '118px',
  backgroundColor: isSelected ? '#3b82f6' : '#fff',
  borderLeft: '1px solid #222',
  borderRight: '1px solid #222',
  borderBottom: '1px solid #222',
  borderTop: '1px solid #ccc',
  position: 'relative',
  flexShrink: 0,
  cursor: 'pointer',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'flex-end',
  alignItems: 'center',
  paddingBottom: '6px',
  boxSizing: 'border-box',
  marginTop: '-1px',
  borderBottomLeftRadius: '4px',
  borderBottomRightRadius: '4px',
  boxShadow: isSelected ? 'inset 0 -5px 10px rgba(0,0,0,0.2), 0 4px 12px #3b82f6' : 'none',
  color: isSelected ? '#fff' : '#000'
});

const getBlackStyle = (isSelected: boolean): React.CSSProperties => ({
  position: 'absolute',
  top: '-1px',
  right: '-12.375px',
  width: '24.75px',
  height: '75px',
  backgroundColor: isSelected ? '#3b82f6' : '#000',
  zIndex: 10,
  borderBottom: isSelected ? '1px solid #000' : '9px solid #000',
  borderLeft: '1px solid #333',
  borderRight: '1px solid #333',
  cursor: 'pointer',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'flex-end',
  alignItems: 'center',
  paddingBottom: '4px',
  boxSizing: 'border-box',
  borderBottomLeftRadius: '2px',
  borderBottomRightRadius: '2px',
  boxShadow: isSelected ? 'inset 0 -5px 10px rgba(0,0,0,0.2), 0 4px 12px #3b82f6' : 'none',
  color: '#fff'
});

export const ScaleStepperKeySwitches25: React.FC = () => {
  const [selectedIndex, setSelectedIndex] = useState<number>(12); // C4 default
  const activeKeys = useMidiStore((state) => state.uiState.activeKeys);
  const scaleDecimalId = useMidiStore((state) => state.activeState.scaleDecimalId);
  const roundPreference = useMidiStore((state) => state.globalSettings.roundPreference);
  const activeStepperNotes = useRef<Record<number, number>>({});

  // When a MIDI note in the stepper zone (48-72) is pressed, highlight that key
  useEffect(() => {
    const stepperKeys = activeKeys.filter(k => k >= 48 && k <= 72);
    if (stepperKeys.length > 0) {
      // Use the most recently added (last in array) stepper key
      const lastKey = stepperKeys[stepperKeys.length - 1];
      setSelectedIndex(lastKey - 48); // MIDI 48 → index 0, MIDI 72 → index 24
    }
  }, [activeKeys]);

  const activeKeyName = STEPPER_DATA_MAP[selectedIndex].noteName;
  const activeOffset = calculateDynamicStepOffset(48 + selectedIndex, scaleDecimalId, roundPreference);
  const activeOffsetLabel = activeOffset > 0 ? `+${activeOffset}` : `${activeOffset}`;

  const triggerStepOn = (i: number, offset: number) => {
    setSelectedIndex(i);
    const finalMidi = executeScaleStep(offset);
    if (finalMidi !== null) {
      activeStepperNotes.current[i] = finalMidi;
    }
    useMidiStore.getState().addActiveKey(48 + i);
  };

  const triggerStepOff = (i: number) => {
    const targetNote = activeStepperNotes.current[i];
    if (targetNote !== undefined) {
      useMidiStore.getState().removeOutputKey(targetNote);
      delete activeStepperNotes.current[i];
    }
    useMidiStore.getState().removeActiveKey(48 + i);
  };

  return (
    <div 
      data-selected-index={selectedIndex}
      data-keys-count={STEPPER_DATA_MAP.length}
      style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', backgroundColor: 'transparent', padding: '0px', width: '607.5px' }}
      className="h-full justify-between"
    >
      {/* Top Strip */}
      <div 
        id="scale-stepper-strip"
        data-testid="top-strip"
        style={{ 
          width: '607.5px', 
          height: '34px',
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          backgroundColor: '#fff', 
          marginBottom: '5px',
          fontFamily: "'Roboto Mono', monospace",
          fontSize: '18px',
          fontWeight: 'bold',
          color: '#000',
          borderRadius: '4px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
          position: 'relative',
          zIndex: 300
        }}
      >
        {activeOffsetLabel}
      </div>

      {/* Keyboard Layout Container */}
      <div style={containerStyle}>
        <div 
          id="shadow-blocker-strip"
          style={{
            position: 'absolute',
            top: '-10px',
            left: 0,
            width: '100%',
            height: '10px',
            backgroundColor: '#1a1a1a',
            zIndex: 200,
            pointerEvents: 'none'
          }}
        />

        {STEPPER_DATA_MAP.map((item, i) => {
          if (item.isBlack) return null;

          const isSelected = selectedIndex === i;
          const nextItem = STEPPER_DATA_MAP[i + 1];
          const hasNestedBlack = nextItem && nextItem.isBlack;

          const offset = calculateDynamicStepOffset(48 + i, scaleDecimalId, roundPreference);
          const offsetLabel = offset > 0 ? `+${offset}` : `${offset}`;

          let nextOffsetLabel = '';
          let nextOffset = 0;
          if (hasNestedBlack) {
            nextOffset = calculateDynamicStepOffset(48 + i + 1, scaleDecimalId, roundPreference);
            nextOffsetLabel = nextOffset > 0 ? `+${nextOffset}` : `${nextOffset}`;
          }

          return (
            <div
              key={i}
              data-key-type="white"
              data-key-index={i}
              style={getWhiteStyle(isSelected)}
              onPointerDown={(e) => {
                e.preventDefault();
                triggerStepOn(i, offset);
              }}
              onPointerUp={() => triggerStepOff(i)}
              onPointerLeave={() => triggerStepOff(i)}
            >
              <span style={{ fontSize: '14px', fontWeight: 'bold', pointerEvents: 'none', userSelect: 'none' }}>{offsetLabel}</span>

              {hasNestedBlack && (
                <div
                  data-key-type="black"
                  data-key-index={i + 1}
                  style={getBlackStyle(selectedIndex === (i + 1))}
                  onPointerDown={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    triggerStepOn(i + 1, nextOffset);
                  }}
                  onPointerUp={(e) => {
                    e.stopPropagation();
                    triggerStepOff(i + 1);
                  }}
                  onPointerLeave={() => triggerStepOff(i + 1)}
                >
                  <span style={{ fontSize: '14px', fontWeight: 'bold', pointerEvents: 'none', userSelect: 'none', color: '#fff' }}>{nextOffsetLabel}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ScaleStepperKeySwitches25;
