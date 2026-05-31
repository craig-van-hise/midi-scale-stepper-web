import { useState, useEffect } from 'react';
import { useMidiStore } from '../store/useMidiStore';
import { executeScaleStep } from '../utils/ScaleStepperEngine';

export interface StepperData {
  note: string;
  index: string;
  interval: string;
  isBlack: boolean;
}

export const STEPPER_DATA_MAP: StepperData[] = [
  { note: 'C4', index: '-7', interval: '-P8', isBlack: false },
  { note: 'Db4', index: '-6', interval: '-m7', isBlack: true },
  { note: 'D4', index: '-6', interval: '-m7', isBlack: false },
  { note: 'Eb4', index: '-5', interval: '-m6', isBlack: true },
  { note: 'E4', index: '-5', interval: '-m6', isBlack: false },
  { note: 'F4', index: '-4', interval: '-P5', isBlack: false },
  { note: 'Gb4', index: '-3', interval: '-P4', isBlack: true },
  { note: 'G4', index: '-3', interval: '-P4', isBlack: false },
  { note: 'Ab4', index: '-2', interval: '-m3', isBlack: true },
  { note: 'A4', index: '-2', interval: '-m3', isBlack: false },
  { note: 'Bb4', index: '-1', interval: '-m2', isBlack: true },
  { note: 'B4', index: '-1', interval: '-m2', isBlack: false },
  { note: 'C5', index: '0', interval: 'Unison', isBlack: false },
  { note: 'Db5', index: '+1', interval: '+M2', isBlack: true },
  { note: 'D5', index: '+1', interval: '+M2', isBlack: false },
  { note: 'Eb5', index: '+2', interval: '+M3', isBlack: true },
  { note: 'E5', index: '+2', interval: '+M3', isBlack: false },
  { note: 'F5', index: '+3', interval: '+P4', isBlack: false },
  { note: 'Gb5', index: '+4', interval: '+P5', isBlack: true },
  { note: 'G5', index: '+4', interval: '+P5', isBlack: false },
  { note: 'Ab5', index: '+5', interval: '+M6', isBlack: true },
  { note: 'A5', index: '+5', interval: '+M6', isBlack: false },
  { note: 'Bb5', index: '+6', interval: '+M7', isBlack: true },
  { note: 'B5', index: '+6', interval: '+M7', isBlack: false },
  { note: 'C6', index: '+7', interval: '+P8', isBlack: false }
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


const ScaleStepperKeySwitches25: React.FC = () => {
  const [selectedIndex, setSelectedIndex] = useState<number>(12); // C5 default
  const activeKeys = useMidiStore((state) => state.uiState.activeKeys);

  // When a MIDI note in the stepper zone (60-84) is pressed, highlight that key
  useEffect(() => {
    const stepperKeys = activeKeys.filter(k => k >= 60 && k <= 84);
    if (stepperKeys.length > 0) {
      // Use the most recently added (last in array) stepper key
      const lastKey = stepperKeys[stepperKeys.length - 1];
      setSelectedIndex(lastKey - 60); // MIDI 60 → index 0, MIDI 72 → index 12
    }
  }, [activeKeys]);

  const activeKey = STEPPER_DATA_MAP[selectedIndex];

  const triggerStep = (stepOffset: number) => {
    executeScaleStep(stepOffset);
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
        {activeKey.note} | {activeKey.index}
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

          return (
            <div
              key={i}
              data-key-type="white"
              data-key-index={i}
              style={getWhiteStyle(isSelected)}
              onClick={() => {
                setSelectedIndex(i);
                triggerStep(parseInt(item.index, 10));
              }}
            >
              <span style={{ fontSize: '14px', fontWeight: 'bold', pointerEvents: 'none', userSelect: 'none' }}>{item.index}</span>

              {hasNestedBlack && (
                <div
                  data-key-type="black"
                  data-key-index={i + 1}
                  style={getBlackStyle(selectedIndex === (i + 1))}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedIndex(i + 1);
                    triggerStep(parseInt(nextItem.index, 10));
                  }}
                >
                  <span style={{ fontSize: '14px', fontWeight: 'bold', pointerEvents: 'none', userSelect: 'none', color: '#fff' }}>{nextItem.index}</span>
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
