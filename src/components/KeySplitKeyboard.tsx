import React, { useState, useEffect, useRef } from 'react';
import { 
  NoteRects, 
  whiteKeys, 
  blackKeys, 
  getLeftBound, 
  getRightBound, 
  getStartNoteFromX, 
  getEndNoteFromX 
} from './keyboardMap';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { useMidiStore } from '../store/useMidiStore';
import { calculateBitmaskDecimal } from '../utils/BitmaskCalculator';
import { executeScaleStep } from '../utils/ScaleStepperEngine';
import { STEPPER_DATA_MAP } from './ScaleStepperKeySwitches25';
import { STANDARD_PITCH_CLASSES, NOTE_TO_PC } from './ScaleKeySwitches12';


interface Zone {
  id: string;
  startNote: number;
  endNote: number;
  channel: number;
  color: string;
  octave: number;
  label: string;
  type: string;
}

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
                stroke={i === 6 ? "rgba(0,0,0,0.4)" : "rgba(0,0,0,0.15)"}
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
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[12px] h-[12px] bg-gray-300 rounded-full shadow-[inset_0_1px_2px_rgba(0,0,0,0.2)] group-active:bg-gray-400" />
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

type DragState = 
  | { type: 'handle'; handle: 'left' | 'right'; zoneId: string }
  | { type: 'seam'; leftId: string; rightId: string }
  | { type: 'body'; zoneId: string; startX: number; mouseX: number; clickOffsetX: number }
  | null;

export default function KeySplitKeyboard() {
  const activeKeys = useMidiStore((state) => state.uiState.activeKeys);
  const startOctave = useMidiStore((state) => state.globalSettings.startOctave);
  const setStartOctave = useMidiStore((state) => state.setStartOctave);
  const setRootNote = useMidiStore((state) => state.setRootNote);
  const setScaleDecimalId = useMidiStore((state) => state.setScaleDecimalId);
  const addActiveKey = useMidiStore((state) => state.addActiveKey);
  const removeActiveKey = useMidiStore((state) => state.removeActiveKey);
  const removeOutputKey = useMidiStore((state) => state.removeOutputKey);

  const [zones, setZones] = useState<Zone[]>([
    { id: 'thru-low', startNote: 21, endNote: 35, channel: 1, color: '#64748b', octave: 0, label: 'Thru', type: 'thru' },
    { id: 'root-select', startNote: 36, endNote: 47, channel: 1, color: '#f97316', octave: 0, label: 'Root Select', type: 'root' },
    { id: 'scale-select', startNote: 48, endNote: 59, channel: 1, color: '#eab308', octave: 0, label: 'Scale Select', type: 'scale' },
    { id: 'stepper', startNote: 60, endNote: 84, channel: 1, color: '#3b82f6', octave: startOctave - 4, label: 'Stepper', type: 'stepper' },
    { id: 'thru-high', startNote: 85, endNote: 108, channel: 1, color: '#64748b', octave: 0, label: 'Thru', type: 'thru' },
  ]);

  const zonesRef = useRef<Zone[]>(zones);
  const [activeZoneId, setActiveZoneId] = useState<string | null>(null);
  const [dragState, setDragState] = useState<DragState>(null);
  const dragStateRef = useRef<DragState>(dragState);
  const [isShiftDown, setIsShiftDown] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const prevActiveKeysRef = useRef<number[]>([]);

  // Sync refs and call optional callbacks
  const applyZones = (newZones: Zone[]) => {
    setZones(newZones);
    zonesRef.current = newZones;
  };

  useEffect(() => {
    zonesRef.current = zones;
  }, [zones]);

  // Sync store's startOctave with stepper zone's octave
  useEffect(() => {
    const stepperZone = zones.find(z => z.type === 'stepper');
    if (stepperZone) {
      const targetOctave = stepperZone.octave + 4; // C4 is octave 4
      if (targetOctave !== startOctave) {
        setStartOctave(targetOctave);
      }
    }
  }, [zones, startOctave, setStartOctave]);

  useEffect(() => {
    dragStateRef.current = dragState;
  }, [dragState]);

  // Evaluate note-on events on store activeKeys change
  useEffect(() => {
    const prevActive = prevActiveKeysRef.current;
    const newlyPressed = activeKeys.filter((k) => !prevActive.includes(k));

    newlyPressed.forEach((note) => {
      // Find which zone this note belongs to based on current zone boundaries
      const zone = zonesRef.current.find(z => note >= z.startNote && note <= z.endNote);
      if (zone) {
        if (zone.type === 'root') {
          setRootNote(note % 12);
        } else if (zone.type === 'scale') {
          const switchIndex = note - zone.startNote;
          const currentState = useMidiStore.getState().activeState;
          const targetSwitchData = currentState.keySwitches[switchIndex];
          if (targetSwitchData) {
            const pcs = STANDARD_PITCH_CLASSES[targetSwitchData.type] || STANDARD_PITCH_CLASSES['Major'];
            const decimal = calculateBitmaskDecimal(pcs);
            const rootPC = NOTE_TO_PC[targetSwitchData.root] ?? 0;
            useMidiStore.getState().setActiveState({
              ...currentState,
              activeSwitchIndex: switchIndex,
              scaleDecimalId: decimal,
              rootNote: rootPC
            });
          }
        }
      }
    });

    prevActiveKeysRef.current = activeKeys;
  }, [activeKeys, setRootNote, setScaleDecimalId]);

  // Global mouse monitoring for drag interactions
  useEffect(() => {
    const handleKeyDownGlob = (e: KeyboardEvent) => {
      if (e.key === 'Shift') setIsShiftDown(true);
    };
    const handleKeyUpGlob = (e: KeyboardEvent) => {
      if (e.key === 'Shift') setIsShiftDown(false);
    };

    window.addEventListener('keydown', handleKeyDownGlob);
    window.addEventListener('keyup', handleKeyUpGlob);

    const handleMouseMove = (e: MouseEvent) => {
      setIsShiftDown(prev => prev !== e.shiftKey ? e.shiftKey : prev);
      
      const drag = dragStateRef.current;
      if (!drag) return;

      const keyboardWrapper = document.getElementById('keyboard-wrapper');
      if (!keyboardWrapper) return;
      const rect = keyboardWrapper.getBoundingClientRect();
      const localX = e.clientX - rect.left;

      const currentZones = [...zonesRef.current].sort((a, b) => a.startNote - b.startNote);

      if (drag.type === 'handle') {
        const zone = currentZones.find(z => z.id === drag.zoneId);
        if (!zone) return;
        const idx = currentZones.findIndex(z => z.id === zone.id);
        const prev = currentZones[idx - 1];
        const next = currentZones[idx + 1];

        if (drag.handle === 'left') {
          let proposed = getStartNoteFromX(localX);
          const minNote = prev ? prev.endNote + 1 : 21;
          const maxNote = zone.endNote;
          proposed = Math.max(minNote, Math.min(maxNote, proposed));
          
          if (proposed !== zone.startNote) {
            applyZones(currentZones.map(z => z.id === zone.id ? { ...z, startNote: proposed } : z));
          }
        } else {
          let proposed = getEndNoteFromX(localX);
          const minNote = zone.startNote;
          const maxNote = next ? next.startNote - 1 : 108;
          proposed = Math.max(minNote, Math.min(maxNote, proposed));
          
          if (proposed !== zone.endNote) {
            applyZones(currentZones.map(z => z.id === zone.id ? { ...z, endNote: proposed } : z));
          }
        }
      } 
      else if (drag.type === 'seam') {
        const leftZone = currentZones.find(z => z.id === drag.leftId);
        const rightZone = currentZones.find(z => z.id === drag.rightId);
        if (!leftZone || !rightZone) return;

        let proposedEnd = getEndNoteFromX(localX);
        const minNote = leftZone.startNote;
        const maxNote = rightZone.endNote - 1;
        proposedEnd = Math.max(minNote, Math.min(maxNote, proposedEnd));

        if (proposedEnd !== leftZone.endNote) {
          applyZones(currentZones.map(z => {
            if (z.id === leftZone.id) return { ...z, endNote: proposedEnd };
            if (z.id === rightZone.id) return { ...z, startNote: proposedEnd + 1 };
            return z;
          }));
        }
      } 
      else if (drag.type === 'body') {
        setDragState(prev => prev ? { ...prev, mouseX: e.clientX } : null);

        const hoveredZone = currentZones.find(z => {
          if (z.id === drag.zoneId) return false;
          const l = getLeftBound(z.startNote);
          const r = getRightBound(z.endNote);
          return localX >= l && localX <= r;
        });

        if (hoveredZone) {
          const draggingZone = currentZones.find(z => z.id === drag.zoneId);
          if (!draggingZone) return;
          const center = (getLeftBound(hoveredZone.startNote) + getRightBound(hoveredZone.endNote)) / 2;

          let doSwap = false;
          if (draggingZone.startNote < hoveredZone.startNote && localX > center) doSwap = true;
          if (draggingZone.startNote > hoveredZone.startNote && localX < center) doSwap = true;

          if (doSwap) {
            const dragSpan = draggingZone.endNote - draggingZone.startNote;
            const hoverSpan = hoveredZone.endNote - hoveredZone.startNote;
            const anchorNote = Math.min(draggingZone.startNote, hoveredZone.startNote);
            
            let newDragStart, newDragEnd, newHoverStart, newHoverEnd;

            if (draggingZone.startNote > hoveredZone.startNote) {
              newDragStart = anchorNote;
              newDragEnd = newDragStart + dragSpan;
              newHoverStart = newDragEnd + 1;
              newHoverEnd = newHoverStart + hoverSpan;
            } else {
              newHoverStart = anchorNote;
              newHoverEnd = newHoverStart + hoverSpan;
              newDragStart = newHoverEnd + 1;
              newDragEnd = newDragStart + dragSpan;
            }

            const newLeft = getLeftBound(newDragStart);
            const oldLeft = getLeftBound(draggingZone.startNote);
            const leftChange = newLeft - oldLeft;
            setDragState(prev => prev && prev.type === 'body' ? { ...prev, startX: prev.startX + leftChange } : null);

            applyZones(currentZones.map(z => {
              if (z.id === draggingZone.id) return { ...z, startNote: newDragStart, endNote: newDragEnd };
              if (z.id === hoveredZone.id) return { ...z, startNote: newHoverStart, endNote: newHoverEnd };
              return z;
            }));
          }
        }
      }
    };

    const handleMouseUp = () => setDragState(null);

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDownGlob);
      window.removeEventListener('keyup', handleKeyUpGlob);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape' && activeZoneId) {
      e.stopPropagation();
      setActiveZoneId(null);
    }
  };

  const updateZoneField = (id: string, updates: Partial<Zone>) => {
    const updated = zonesRef.current.map(z => {
      if (z.id === id) {
        return { ...z, ...updates };
      }
      return z;
    });
    applyZones(updated);
  };

  // Synchronize store's activeKeys with DOM updates
  useEffect(() => {
    for (let n = 21; n <= 108; n++) {
      const el = document.getElementById(`pksplit-${n}`);
      if (!el) continue;
      const isAssigned = zones.some(z => n >= z.startNote && n <= z.endNote);
      const isKeyActive = activeKeys.includes(n);

      if (isKeyActive) {
        const zone = zones.find(z => n >= z.startNote && n <= z.endNote);
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
  }, [activeKeys, zones]);

  const playNote = (note: number) => {
    if (note >= 60 && note <= 84) {
      const mapIndex = note - 60;
      const mappedData = STEPPER_DATA_MAP[mapIndex];
      if (mappedData) {
        const stepOffset = parseInt(mappedData.index, 10);
        executeScaleStep(stepOffset);
      }
    }
    addActiveKey(note);
  };

  const releaseNote = (note: number) => {
    if (note >= 60 && note <= 84) {
      const { lastPlayedMidi } = useMidiStore.getState().activeState;
      if (lastPlayedMidi !== null) {
        removeOutputKey(lastPlayedMidi);
      }
    }
    removeActiveKey(note);
  };

  const handleKeyEnter = (e: React.MouseEvent, note: number) => {
    if (e.buttons === 1) { 
      playNote(note);
    }
  };

  const sortedZones = [...zones].sort((a, b) => a.startNote - b.startNote);

  return (
    <div 
      className={`relative bg-white rounded-lg shadow-[0_8px_24px_rgba(0,0,0,0.15)] outline-none w-[1020px] flex flex-col focus:ring-4 ring-blue-100 select-none transition-all duration-300 ${isCollapsed ? 'h-[40px]' : 'pt-4 pb-[16px] px-[16px]'}`}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      onMouseDown={() => setActiveZoneId(null)}
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

      {/* Upper Control Surface - Split Bar */}
      {!isCollapsed && (
        <div className="relative w-[988px] overflow-visible mb-1 h-[68px]">
          <div className="absolute bottom-0 w-full h-[24px] bg-gray-100 rounded-sm shadow-inner pointer-events-none" />
        {sortedZones.map((zone, idx) => {
          const left = getLeftBound(zone.startNote);
          const right = getRightBound(zone.endNote);
          const width = right - left;
          const isSelected = activeZoneId === zone.id;
          const isGhost = dragState?.type === 'body' && dragState.zoneId === zone.id;
          
          const visualLeft = isGhost ? left + (dragState.mouseX - dragState.startX) : left;

          const nextZone = sortedZones[idx + 1];
          const isTouchingNext = nextZone && (zone.endNote + 1 === nextZone.startNote);
          
          const prevZone = sortedZones[idx - 1];
          const isTouchingPrev = prevZone && (prevZone.endNote + 1 === zone.startNote);

          return (
            <React.Fragment key={zone.id}>
              {/* Floating Octave Knob */}
              {!isCollapsed && (
                <div 
                  className="absolute top-0 flex items-center justify-center h-[44px] pointer-events-none z-20"
                  style={{
                    left: visualLeft,
                    width: width,
                  }}
                >
                  <div className="pointer-events-auto">
                    <OctaveKnob value={zone.octave} onChange={(v) => updateZoneField(zone.id, { octave: v })} />
                  </div>
                </div>
              )}

              <div
                id={`zone-${zone.id}`}
                className="absolute bottom-0 h-[24px] flex items-center justify-center rounded-sm transition-opacity"
                style={{
                  left: visualLeft,
                  width: width,
                  backgroundColor: zone.color,
                  opacity: isGhost ? 0.6 : 1,
                  zIndex: isGhost ? 50 : isSelected ? 30 : 10,
                  boxShadow: isSelected ? `0 0 0 2px ${zone.color}, 0 0 10px ${zone.color}` : '0 2px 4px rgba(0,0,0,0.1)',
                }}
                onMouseDown={(e) => {
                  e.stopPropagation();
                  setActiveZoneId(zone.id);
                  setDragState({
                    type: 'body',
                    zoneId: zone.id,
                    startX: e.clientX,
                    mouseX: e.clientX,
                    clickOffsetX: e.clientX - e.currentTarget.getBoundingClientRect().left
                  });
                }}
              >
                {/* Static Label */}
                <span className="text-[10px] font-bold text-white uppercase tracking-wider font-sans select-none pointer-events-none">
                  {zone.label}
                </span>

                {/* Left Grip Handle */}
                {(!isTouchingPrev || isShiftDown) && (
                  <div
                    className="absolute left-0 top-0 bottom-0 w-[12px] bg-black/5 hover:bg-black/15 shadow-[inset_-2px_0_4px_rgba(0,0,0,0.15)] cursor-col-resize transition-colors flex items-center justify-center gap-[2px] group rounded-l-sm z-20"
                    onMouseDown={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      setActiveZoneId(zone.id);
                      setDragState({ type: 'handle', handle: 'left', zoneId: zone.id });
                    }}
                  >
                    <div className="w-[1px] h-[16px] bg-black/20 group-hover:bg-black/40 transition-colors" />
                    <div className="w-[1px] h-[16px] bg-black/20 group-hover:bg-black/40 transition-colors" />
                  </div>
                )}

                {/* Right Grip Handle */}
                {(!isTouchingNext || isShiftDown) && (
                  <div
                    className="absolute right-0 top-0 bottom-0 w-[12px] bg-black/5 hover:bg-black/15 shadow-[inset_2px_0_4px_rgba(0,0,0,0.15)] cursor-col-resize transition-colors flex items-center justify-center gap-[2px] group rounded-r-sm z-20"
                    onMouseDown={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      setActiveZoneId(zone.id);
                      setDragState({ type: 'handle', handle: 'right', zoneId: zone.id });
                    }}
                  >
                    <div className="w-[1px] h-[16px] bg-black/20 group-hover:bg-black/40 transition-colors" />
                    <div className="w-[1px] h-[16px] bg-black/20 group-hover:bg-black/40 transition-colors" />
                  </div>
                )}
              </div>
            </React.Fragment>
          );
        })}

        {/* Pass 2: Seam Drag Handles */}
        {!isShiftDown && sortedZones.map((zone, idx) => {
          const nextZone = sortedZones[idx + 1];
          const isTouchingNext = nextZone && (zone.endNote + 1 === nextZone.startNote);
          if (!isTouchingNext) return null;

          const rightEdge = getRightBound(zone.endNote);

          return (
            <div
              key={`seam-${zone.id}`}
              className="absolute bottom-0 h-[24px] w-[24px] z-40 cursor-ew-resize flex items-center justify-center group"
              style={{ left: rightEdge, transform: 'translateX(-50%)' }}
              onMouseDown={(e) => {
                e.stopPropagation();
                e.preventDefault();
                setActiveZoneId(zone.id);
                setDragState({ type: 'seam', leftId: zone.id, rightId: nextZone.id });
              }}
            >
              <div 
                className="w-[14px] h-[14px] bg-white border-[2.5px] rounded-full shadow-md group-hover:scale-125 transition-all" 
                style={{ borderColor: zone.color }}
              />
            </div>
          );
        })}
      </div>
      )}

      {/* Lower Surface - Architecture Physical Keyboard */}
      {!isCollapsed && (
        <div id="keyboard-wrapper" className="relative flex w-[988px] h-[58px] bg-white pointer-events-auto border-t border-[#7a7a7a]" style={{ boxShadow: '0 4px 10px rgba(0,0,0,0.2)' }}>
          {whiteKeys.map((n) => {
            const isAssigned = sortedZones.some(z => n >= z.startNote && n <= z.endNote);
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
        
        {blackKeys.map((n) => {
          const isAssigned = sortedZones.some(z => n >= z.startNote && n <= z.endNote);
          return (
            <div
              key={n}
              id={`pksplit-${n}`}
              className={`absolute z-10 transition-colors duration-75`}
              style={{
                left: `${NoteRects[n].x}px`,
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
      )}
    </div>
  );
}
