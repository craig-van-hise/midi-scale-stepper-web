import React, { useState, useEffect, useRef } from 'react';
import { 
  NoteRects, 
  whiteKeys, 
  blackKeys 
} from './keyboardMap';
import { ChevronDown, ChevronUp, Settings } from 'lucide-react';
import { useMidiStore } from '../store/useMidiStore';
import { calculateBitmaskDecimal } from '../utils/BitmaskCalculator';
import { executeScaleStep, applyOutputFilter } from '../utils/ScaleStepperEngine';
import { STANDARD_PITCH_CLASSES, NOTE_TO_PC } from './ScaleKeySwitches12';
import { roundNote, calculateDynamicStepOffset } from '../utils/RoundingEngine';
import PlayStartSettingsModal from './PlayStartSettingsModal';
import HomeSettingsModal from './HomeSettingsModal';
import InputSettingsModal from './InputSettingsModal';

interface OctaveKnobProps {
  value: number;
  onChange: (val: number) => void;
}

function OctaveKnob({ value, onChange }: OctaveKnobProps) {
  const startY = useRef(0);
  const startVal = useRef(0);

  const handlePointerDown = (e: React.PointerEvent) => {
    e.stopPropagation();
    e.preventDefault();
    startY.current = e.clientY;
    startVal.current = value;

    const handlePointerMove = (ev: PointerEvent) => {
      ev.preventDefault();
      const deltaY = startY.current - ev.clientY;
      const steps = Math.round(deltaY / 8); 
      let newVal = startVal.current + steps;
      newVal = Math.max(-6, Math.min(6, newVal));
      onChange(newVal);
    };

    const handlePointerUp = () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
  };

  const angle = value * 22.5;

  return (
    <div
      className="relative z-20 select-none cursor-ns-resize group p-1 rounded-full hover:bg-black/5 transition-colors flex items-center justify-center font-sans"
      onPointerDown={handlePointerDown}
      onMouseDown={(e) => e.stopPropagation()}
      onDoubleClick={(e) => e.stopPropagation()}
    >
      <div className="relative w-[31px] h-[31px]">
        {/* Draw arc and notches */}
        <svg fill="none" viewBox="0 0 32 32" className="absolute inset-0 w-full h-full">
          <path d="M 7.3 24.7 A 12.3 12.3 0 1 1 24.7 24.7" stroke="rgba(0,0,0,0.15)" strokeWidth="3" strokeLinecap="round" />
          {Array.from({ length: 13 }).map((_, i) => {
            const rot = -135 + i * 22.5;
            return (
              <line
                key={i}
                x1="16"
                y1="3.5"
                x2="16"
                y2="5.5"
                stroke={i === 6 ? "rgba(0,0,0,0.5)" : "rgba(0,0,0,0.15)"}
                strokeWidth="1.5"
                transform={`rotate(${rot} 16 16)`}
              />
            );
          })}
        </svg>

        {/* Pointer indicator */}
        <div
          className="absolute inset-0 transition-transform duration-75"
          style={{ transform: `rotate(${angle}deg)` }}
        >
          <div className="absolute top-[6px] left-1/2 -translate-x-1/2 w-[2px] h-[7px] bg-gray-600 rounded-full" />
        </div>

        {/* Center dot */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[12px] h-[12px] bg-cyan-500 rounded-full shadow-[inset_0_1px_2px_rgba(0,0,0,0.2)] group-active:bg-cyan-400" />
      </div>

      <div className="absolute left-[calc(100%+2px)] flex flex-col justify-center w-[20px] pointer-events-none">
        <span className="text-[8px] font-bold text-gray-500 uppercase tracking-wider leading-none mb-[2px]">Oct</span>
        <span className="text-[11px] font-bold text-gray-700 font-mono leading-none">
          {value > 0 ? `+${value}` : value}
        </span>
      </div>
    </div>
  );
}

export const ZONES_CONFIG = [
  { id: 'home', startNote: 21, endNote: 23, color: '#855845', label: '', type: 'home' },
  { id: 'root-select', startNote: 24, endNote: 35, color: '#f97316', label: 'ROOT SELECT', type: 'root' },
  { id: 'scale-select', startNote: 36, endNote: 47, color: '#eab308', label: 'SCALE SELECT', type: 'scale' },
  { id: 'stepper', startNote: 48, endNote: 71, color: '#3b82f6', label: 'STEPPER', type: 'stepper' },
  { id: 'play-start', startNote: 72, endNote: 108, color: '#06b6d4', label: 'PLAY/START NOTE', type: 'play-start' },
] as const;

export default function KeySplitKeyboard() {
  const activeKeys = useMidiStore((state) => state.uiState.activeKeys);
  const activeNotesRegistry = useRef<Map<number, number>>(new Map());

  const rootNote = useMidiStore((state) => state.activeState.rootNote);
  const activeSwitchIndex = useMidiStore((state) => state.activeState.activeSwitchIndex);
  const lastPlayedMidi = useMidiStore((state) => state.activeState.lastPlayedMidi);

  const playStartSettings = useMidiStore((state) => state.playStartSettings);
  const updatePlayStartSettings = useMidiStore((state) => state.updatePlayStartSettings);

  const inputKeyboardSize = useMidiStore((state) => state.globalSettings.inputKeyboardSize || 88);

  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isPlayStartSettingsOpen, setIsPlayStartSettingsOpen] = useState(false);
  const [isHomeSettingsOpen, setIsHomeSettingsOpen] = useState(false);
  const [isInputSettingsOpen, setIsInputSettingsOpen] = useState(false);

  const startNote = inputKeyboardSize === 88 ? 21 : 36;
  const endNote = inputKeyboardSize === 88 ? 108 : 84;
  const offsetX = NoteRects[startNote].x;
  const currentWhiteKeys = whiteKeys.filter(n => n >= startNote && n <= endNote);
  const currentBlackKeys = blackKeys.filter(n => n >= startNote && n <= endNote);
  const wrapperWidth = currentWhiteKeys.length * 19;

  const rootZone = inputKeyboardSize === 88 ? [24, 35] : [36, 47];
  const scaleZone = inputKeyboardSize === 88 ? [36, 47] : [48, 59];
  const stepperZone = inputKeyboardSize === 88 ? [48, 71] : [60, 71];
  const playStartBound = 72;

  const rootWhiteKeysCount = currentWhiteKeys.filter(n => n >= rootZone[0] && n <= rootZone[1]).length;
  const scaleWhiteKeysCount = currentWhiteKeys.filter(n => n >= scaleZone[0] && n <= scaleZone[1]).length;
  const stepperWhiteKeysCount = currentWhiteKeys.filter(n => n >= stepperZone[0] && n <= stepperZone[1]).length;
  const playWhiteKeysCount = currentWhiteKeys.filter(n => n >= playStartBound && n <= endNote).length;
  const homeWhiteKeysCount = currentWhiteKeys.filter(n => n >= 21 && n <= 23).length;

  const zones = inputKeyboardSize === 88 ? [
    { id: 'home', startNote: 21, endNote: 23, color: '#855845', label: '', type: 'home', whiteKeysCount: homeWhiteKeysCount },
    { id: 'root-select', startNote: 24, endNote: 35, color: '#f97316', label: 'ROOT SELECT', type: 'root', whiteKeysCount: rootWhiteKeysCount },
    { id: 'scale-select', startNote: 36, endNote: 47, color: '#eab308', label: 'SCALE SELECT', type: 'scale', whiteKeysCount: scaleWhiteKeysCount },
    { id: 'stepper', startNote: 48, endNote: 71, color: '#3b82f6', label: 'STEPPER', type: 'stepper', whiteKeysCount: stepperWhiteKeysCount },
    { id: 'play-start', startNote: 72, endNote: 108, color: '#06b6d4', label: 'PLAY/START NOTE', type: 'play-start', whiteKeysCount: playWhiteKeysCount },
  ] : [
    { id: 'root-select', startNote: 36, endNote: 47, color: '#f97316', label: 'ROOT SELECT', type: 'root', whiteKeysCount: rootWhiteKeysCount },
    { id: 'scale-select', startNote: 48, endNote: 59, color: '#eab308', label: 'SCALE SELECT', type: 'scale', whiteKeysCount: scaleWhiteKeysCount },
    { id: 'stepper', startNote: 60, endNote: 71, color: '#3b82f6', label: 'STEPPER', type: 'stepper', whiteKeysCount: stepperWhiteKeysCount },
    { id: 'play-start', startNote: 72, endNote: 84, color: '#06b6d4', label: 'PLAY/START NOTE', type: 'play-start', whiteKeysCount: playWhiteKeysCount },
  ];

  // Synchronize store's activeKeys and latching with DOM updates
  useEffect(() => {
    for (let n = startNote; n <= endNote; n++) {
      const el = document.getElementById(`pksplit-${n}`);
      if (!el) continue;
      
      const zone = zones.find(z => n >= z.startNote && n <= z.endNote);
      const isAssigned = !!zone;
      
      const stepperOffset = inputKeyboardSize === 88 ? 48 : 60;
      const isInStepperZone = n >= stepperZone[0] && n <= stepperZone[1];

      // Highlight if key is physically active OR visually latched
      const isKeyActive = 
        (isInStepperZone ? activeKeys.includes(48 + (n - stepperOffset)) : activeKeys.includes(n)) ||
        (rootNote !== null && n === rootZone[0] + (rootNote % 12)) ||
        (n === scaleZone[0] + activeSwitchIndex) ||
        (lastPlayedMidi !== null && n === lastPlayedMidi - ((playStartSettings.octaveOffset ?? 0) * 12) && n >= playStartBound && n <= endNote);

      if (isKeyActive) {
        const color = zone ? zone.color : '#64748b';
        el.style.backgroundColor = color;
        el.style.boxShadow = `0 0 12px ${color}, inset 0 0 6px rgba(255,255,255,0.4)`;
        if (!NoteRects[n].isBlack) {
          el.style.borderLeft = `1px solid ${color}`;
          el.style.borderRight = `1px solid ${color}`;
          el.style.borderBottom = `1px solid ${color}`;
          el.style.borderTop = 'none';
        }
      } else {
        if (NoteRects[n].isBlack) {
          el.style.backgroundColor = isAssigned ? '#3a3a3a' : '#4a4a4a';
          el.style.boxShadow = 'none';
        } else {
          el.style.backgroundColor = isAssigned ? '#ffffff' : '#8c8c8c';
          el.style.boxShadow = 'none';
          el.style.borderLeft = '1px solid #7a7a7a';
          el.style.borderRight = '1px solid #7a7a7a';
          el.style.borderBottom = '1px solid #7a7a7a';
          el.style.borderTop = 'none';
        }
      }
    }
  }, [activeKeys, rootNote, activeSwitchIndex, lastPlayedMidi, inputKeyboardSize]);

  const playNote = (note: number) => {
    // 1. Home Zone Intercept
    if (inputKeyboardSize === 88 && note >= 21 && note <= 23) {
      if (note === 21) {
        useMidiStore.getState().triggerHomeReset();
        const freshState = useMidiStore.getState();
        const homeNote = freshState.activeState.lastPlayedMidi;
        if (homeNote !== null && freshState.homeSettings?.audible) {
          freshState.addOutputKey(homeNote);
          activeNotesRegistry.current.set(note, homeNote);
        }
      }
      useMidiStore.getState().addActiveKey(note);
      return;
    }

    // 2. Root Select Zone
    if (note >= rootZone[0] && note <= rootZone[1]) {
      const rootVal = note - rootZone[0];
      useMidiStore.getState().setRootNote(rootVal);
      return;
    }

    // 3. Scale Select Zone
    if (note >= scaleZone[0] && note <= scaleZone[1]) {
      const switchIndex = note - scaleZone[0];
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

    // 4. Stepper Zone
    if (note >= stepperZone[0] && note <= stepperZone[1]) {
      const stepperOffset = inputKeyboardSize === 88 ? 48 : 60;
      const targetIndex = note - stepperOffset;
      useMidiStore.getState().processStepperAction(targetIndex, true, executeScaleStep);
      return;
    }

    // 5. Play/Start Note Zone
    if (note >= playStartBound && note <= endNote) {
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
      
      state.addActiveKey(note);
      return;
    }

    useMidiStore.getState().addActiveKey(note);
  };

  const releaseNote = (note: number) => {
    if (inputKeyboardSize === 88 && note >= 21 && note <= 23) {
      const freshState = useMidiStore.getState();
      freshState.removeActiveKey(note);
      
      const targetNote = activeNotesRegistry.current.get(note);
      if (targetNote !== undefined) {
        freshState.removeOutputKey(targetNote);
        activeNotesRegistry.current.delete(note);
      }
      return;
    }
    if (note >= rootZone[0] && note <= rootZone[1]) {
      return;
    }
    if (note >= scaleZone[0] && note <= scaleZone[1]) {
      return;
    }
    if (note >= stepperZone[0] && note <= stepperZone[1]) {
      const stepperOffset = inputKeyboardSize === 88 ? 48 : 60;
      const targetIndex = note - stepperOffset;
      useMidiStore.getState().processStepperAction(targetIndex, false);
      return;
    }
    if (note >= playStartBound && note <= endNote) {
      const targetNote = activeNotesRegistry.current.get(note);
      const freshState = useMidiStore.getState();
      if (targetNote !== undefined) {
        const { audible } = freshState.playStartSettings;
        if (audible) {
          freshState.removeOutputKey(targetNote);
        }
        activeNotesRegistry.current.delete(note);
      }
      freshState.removeActiveKey(note);
      return;
    }

    useMidiStore.getState().removeActiveKey(note);
  };

  const handleKeyEnter = (e: React.MouseEvent, note: number) => {
    if (e.buttons === 1) { 
      playNote(note);
    }
  };

  return (
    <div 
      className={`relative bg-white rounded-lg shadow-[0_8px_24px_rgba(0,0,0,0.15)] outline-none w-[1020px] flex flex-col focus:ring-4 ring-blue-100 select-none transition-all duration-300 ${isCollapsed ? 'h-[40px]' : 'pt-3 pb-2 px-[16px]'}`}
      tabIndex={0}
      onMouseDown={(e) => e.stopPropagation()}
    >
      {/* Collapse Toggle */}
      <div 
        className="absolute top-[10px] left-[14px] flex items-center gap-1.5 cursor-pointer z-30 opacity-70 hover:opacity-100 transition-opacity font-sans"
        onClick={(e) => {
          e.stopPropagation();
          setIsCollapsed(!isCollapsed);
        }}
        title="Toggle Keyboard"
      >
        {isCollapsed ? (
          <ChevronDown className="w-4 h-4 text-gray-700" strokeWidth={2.5} />
        ) : (
          <ChevronUp className="w-4 h-4 text-gray-700" strokeWidth={2.5} />
        )}
        <span className="font-semibold text-[14px] text-gray-700 select-none font-sans">Input</span>
      </div>

      {/* Settings Cog */}
      <button
        id="toggle-input-settings"
        onClick={(e) => {
          e.stopPropagation();
          setIsInputSettingsOpen(true);
        }}
        className="absolute top-[10px] right-[14px] p-1 text-gray-400 hover:text-gray-600 transition-colors z-30 cursor-pointer"
        title="Input Keyboard Settings"
      >
        <Settings className="w-4 h-4" />
      </button>

      {/* Centering Wrapper */}
      {!isCollapsed && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', marginTop: '32px' }}>
          {/* Upper Control Surface - Split Bar */}
          <div className="relative overflow-visible mb-1 h-[32px]" style={{ width: `${wrapperWidth}px` }}>
            <div className="absolute bottom-0 w-full h-[24px] bg-gray-100 rounded-sm shadow-inner pointer-events-none" />
            {(() => {
              let accumulatedLeft = 0;
              return zones.map((zone) => {
                const width = zone.whiteKeysCount * 19;
                const left = accumulatedLeft;
                accumulatedLeft += width;

                return (
                  <div
                    key={zone.id}
                    id={`zone-${zone.id}`}
                    className="absolute bottom-0 h-[24px] flex items-center justify-center rounded-sm transition-opacity gap-4 px-2"
                    style={{
                      left: `${left}px`,
                      width: `${width}px`,
                      backgroundColor: zone.color,
                      zIndex: 10,
                      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                      overflow: 'visible',
                    }}
                  >
                  {/* Static Label */}
                  {zone.label && (
                    <span className="text-[10px] font-bold text-white uppercase tracking-wider font-sans select-none pointer-events-none">
                      {zone.label}
                    </span>
                  )}

                  {zone.id === 'home' && (
                    <button
                      onClick={() => setIsHomeSettingsOpen(true)}
                      className="p-1 rounded-md text-white hover:bg-white/20 transition-colors cursor-pointer flex items-center justify-center animate-none"
                      title="Home Switch Settings"
                      onMouseDown={(e) => e.stopPropagation()}
                    >
                      <Settings className="w-3.5 h-3.5" />
                    </button>
                  )}

                  {zone.id === 'play-start' && (
                    <>
                      <button
                        onClick={() => setIsPlayStartSettingsOpen(true)}
                        className="absolute right-1 p-0.5 rounded-md text-white hover:bg-white/20 transition-colors cursor-pointer flex items-center justify-center"
                        title="Play/Start Note Settings"
                        onMouseDown={(e) => e.stopPropagation()}
                      >
                        <Settings className="w-3.5 h-3.5" />
                      </button>
                      <div 
                        style={{ 
                          position: 'absolute', 
                          top: '-16px', 
                          left: '50%', 
                          transform: 'translate(-50%, -50%)', 
                          zIndex: 20,
                          display: 'flex',
                          justifyContent: 'center',
                          alignItems: 'center'
                        }}
                        onMouseDown={(e) => e.stopPropagation()}
                      >
                        <div className="scale-[0.8] origin-center">
                          <OctaveKnob 
                            value={playStartSettings.octaveOffset} 
                            onChange={(v) => updatePlayStartSettings({ octaveOffset: v })} 
                          />
                        </div>
                      </div>
                    </>
                  )}
                </div>
              );
            });
          })()}
        </div>

          {/* Lower Surface - Architecture Physical Keyboard */}
          <div id="keyboard-wrapper" className="relative flex h-[58px] bg-white pointer-events-auto border-t border-[#7a7a7a]" style={{ width: `${wrapperWidth}px`, boxShadow: '0 4px 10px rgba(0,0,0,0.2)' }}>
            {currentWhiteKeys.map((n) => {
              const zone = zones.find(z => n >= z.startNote && n <= z.endNote);
              const isAssigned = !!zone;
              const isC = n % 12 === 0;
              const octave = Math.floor(n / 12) - 1;
              return (
                <div
                  key={n}
                  id={`pksplit-${n}`}
                  className="relative transition-colors duration-75 flex items-end justify-center pb-[4px]"
                  style={{
                    width: '19px',
                    height: '58px',
                    flexShrink: 0,
                    backgroundColor: isAssigned ? '#ffffff' : '#8c8c8c',
                    borderLeft: '1px solid #7a7a7a',
                    borderRight: '1px solid #7a7a7a',
                    borderBottom: '1px solid #7a7a7a',
                    borderTop: 'none',
                    borderBottomLeftRadius: '4px',
                    borderBottomRightRadius: '4px',
                    cursor: 'pointer',
                    boxSizing: 'border-box'
                  }}
                  onMouseDown={() => playNote(n)}
                  onMouseUp={() => releaseNote(n)}
                  onMouseLeave={() => releaseNote(n)}
                  onMouseEnter={(e) => handleKeyEnter(e, n)}
                >
                  {isC && (
                    <span 
                      style={{
                        color: '#111827',
                        fontWeight: '600',
                        fontSize: '10px',
                        pointerEvents: 'none',
                        userSelect: 'none'
                      }}
                    >
                      C{octave}
                    </span>
                  )}
                </div>
              );
            })}
          
            {currentBlackKeys.map((n) => {
              const zone = zones.find(z => n >= z.startNote && n <= z.endNote);
              const isAssigned = !!zone;
              return (
                <div
                  key={n}
                  id={`pksplit-${n}`}
                  className={`absolute z-10 transition-colors duration-75`}
                  style={{
                    left: `${NoteRects[n].x - offsetX}px`,
                    top: '-1px',
                    width: '11px',
                    height: '37px',
                    backgroundColor: isAssigned ? '#3a3a3a' : '#4a4a4a',
                    borderBottom: '8px solid #050505',
                    borderLeft: '2px solid #050505',
                    borderRight: '2px solid #050505',
                    borderTop: 'none',
                    borderRadius: '0px',
                    cursor: 'pointer',
                    boxSizing: 'border-box'
                  }}
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    playNote(n);
                  }}
                  onMouseUp={(e) => {
                    e.stopPropagation();
                    releaseNote(n);
                  }}
                  onMouseLeave={() => releaseNote(n)}
                  onMouseEnter={(e) => {
                    e.stopPropagation();
                    handleKeyEnter(e, n);
                  }}
                />
              );
            })}
          </div>
        </div>
      )}

      {/* Settings Modal */}
      <PlayStartSettingsModal 
        isOpen={isPlayStartSettingsOpen} 
        onClose={() => setIsPlayStartSettingsOpen(false)} 
      />
      <HomeSettingsModal 
        isOpen={isHomeSettingsOpen}
        onClose={() => setIsHomeSettingsOpen(false)}
      />
      <InputSettingsModal
        isOpen={isInputSettingsOpen}
        onClose={() => setIsInputSettingsOpen(false)}
      />
    </div>
  );
}
