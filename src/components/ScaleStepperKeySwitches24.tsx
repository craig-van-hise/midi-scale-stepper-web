import { useState, useEffect } from 'react';
import React from 'react';
import { useMidiStore } from '../store/useMidiStore';
import { executeScaleStep } from '../utils/ScaleStepperEngine';
import { Home, Repeat, ArrowUpDown } from 'lucide-react';

export const getDynamicLabel = (action: any, isInverted: boolean): string => {
  if (!action) return '';
  if (action.value === 0) return action.label;
  if (!isInverted) return action.label;
  if (action.type === 'STEP' || action.type === 'OCTAVE') {
    if (action.label.startsWith('+')) {
      return action.label.replace('+', '-');
    }
    if (action.label.startsWith('-')) {
      return action.label.replace('-', '+');
    }
  }
  return action.label;
};

const renderKeyLabel = (action: any, isInverted: boolean = false) => {
  if (!action) return null;
  if (action.type === 'HOME') {
    return <Home size={16} data-testid="icon-home" />;
  }
  if (action.type === 'REPEAT_LAST') {
    return <Repeat size={16} data-testid="icon-repeat" />;
  }
  if (action.type === 'INVERT_TOGGLE') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', lineHeight: 1 }}>
        <ArrowUpDown size={16} data-testid="icon-invert" />
        <span style={{ fontSize: '9px', marginTop: '3px', fontWeight: 'bold' }}>Tog</span>
      </div>
    );
  }
  if (action.type === 'INVERT_MOMENTARY') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', lineHeight: 1 }}>
        <ArrowUpDown size={16} data-testid="icon-invert" />
        <span style={{ fontSize: '9px', marginTop: '3px', fontWeight: 'bold' }}>Hold</span>
      </div>
    );
  }
  return getDynamicLabel(action, isInverted);
};

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
  { noteName: 'B4', isBlack: false }
];

const containerStyle: React.CSSProperties = { 
  display: 'flex', 
  width: '567px', 
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

export const ScaleStepperKeySwitches24: React.FC = () => {
  const [selectedIndex, setSelectedIndex] = useState<number>(12); // C4 default
  const activeKeys = useMidiStore((state) => state.uiState.activeKeys);
  const stepperConfig = useMidiStore((state) => state.uiState.stepperConfig);
  const stepperInvertToggle = useMidiStore((state) => state.uiState.stepperInvertToggle);
  const stepperInvertMomentary = useMidiStore((state) => state.uiState.stepperInvertMomentary);
  const isInverted = stepperInvertToggle !== stepperInvertMomentary;

  // When a MIDI note in the stepper zone (48-71) is pressed, highlight that key
  useEffect(() => {
    const stepperKeys = activeKeys.filter(k => k >= 48 && k <= 71);
    if (stepperKeys.length > 0) {
      const lastKey = stepperKeys[stepperKeys.length - 1];
      const index = lastKey - 48;
      const action = stepperConfig[index];
      if (action && (action.type === 'STEP' || action.type === 'OCTAVE')) {
        setSelectedIndex(index); // MIDI 48 → index 0, MIDI 71 → index 23
      }
    }
  }, [activeKeys, stepperConfig]);

  const activeAction = stepperConfig[selectedIndex];
  const activeOffsetLabel = activeAction ? getDynamicLabel(activeAction, isInverted) : '';

  const handlePointerDown = (i: number) => {
    const action = stepperConfig[i];
    if (action && (action.type === 'STEP' || action.type === 'OCTAVE')) {
      setSelectedIndex(i);
    }
    useMidiStore.getState().processStepperAction(i, true, executeScaleStep);
  };

  const handlePointerUp = (i: number) => {
    useMidiStore.getState().processStepperAction(i, false);
  };

  const getIsSelected = (idx: number) => {
    const action = stepperConfig[idx];
    if (!action) return false;
    if (action.type === 'STEP' || action.type === 'OCTAVE' || action.type === 'CUSTOM') {
      return selectedIndex === idx;
    }
    if (action.type === 'INVERT_TOGGLE') {
      return stepperInvertToggle;
    }
    if (action.type === 'INVERT_MOMENTARY') {
      return stepperInvertMomentary;
    }
    if (action.type === 'HOME' || action.type === 'REPEAT_LAST') {
      return activeKeys.includes(48 + idx);
    }
    return false;
  };

  return (
    <div 
      data-selected-index={selectedIndex}
      data-keys-count={STEPPER_DATA_MAP.length}
      style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', backgroundColor: 'transparent', padding: '0px', width: '567px' }}
      className="h-full justify-between"
    >
      {/* Top Strip */}
      <div 
        id="scale-stepper-strip"
        data-testid="top-strip"
        style={{ 
          width: '567px', 
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

          const action = stepperConfig[i];
          const isSelected = getIsSelected(i);

          const nextItem = STEPPER_DATA_MAP[i + 1];
          const hasNestedBlack = nextItem && nextItem.isBlack;

          let isNestedSelected = false;
          let nextAction = null;
          if (hasNestedBlack) {
            nextAction = stepperConfig[i + 1];
            isNestedSelected = getIsSelected(i + 1);
          }

          return (
            <div
              key={i}
              data-key-type="white"
              data-key-index={i}
              style={getWhiteStyle(isSelected)}
              onPointerDown={(e) => {
                e.preventDefault();
                handlePointerDown(i);
              }}
              onPointerUp={() => handlePointerUp(i)}
              onPointerLeave={() => handlePointerUp(i)}
            >
              <span style={{ fontSize: '12px', fontWeight: 'bold', pointerEvents: 'none', userSelect: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {renderKeyLabel(action, isInverted)}
              </span>

              {hasNestedBlack && (
                <div
                  data-key-type="black"
                  data-key-index={i + 1}
                  style={getBlackStyle(isNestedSelected)}
                  onPointerDown={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    handlePointerDown(i + 1);
                  }}
                  onPointerUp={(e) => {
                    e.stopPropagation();
                    handlePointerUp(i + 1);
                  }}
                  onPointerLeave={() => handlePointerUp(i + 1)}
                >
                  <span style={{ fontSize: '9px', fontWeight: 'bold', pointerEvents: 'none', userSelect: 'none', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {renderKeyLabel(nextAction, isInverted)}
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ScaleStepperKeySwitches24;
