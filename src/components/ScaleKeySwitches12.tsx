import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useMidiStore } from '../store/useMidiStore';
import { calculateBitmaskDecimal } from '../utils/BitmaskCalculator';
import { Settings } from 'lucide-react';
import ScaleChangeSettingsModal from './ScaleChangeSettingsModal';

export interface ScaleSwitchData {
  root: string;
  type: string;
}

export const DEFAULT_SCALES: ScaleSwitchData[] = [
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
];

const CYCLE_OF_FIFTHS = ['Cb', 'Gb', 'Db', 'Ab', 'Eb', 'Bb', 'F', 'C', 'G', 'D', 'A', 'E', 'B', 'F#', 'C#'];

const TYPE_OPTIONS = [
  'Major',
  'Dorian',
  'Phrygian',
  'Lydian',
  'Mixolydian',
  'Natural Minor',
  'Locrian',
  'Harmonic Minor',
  'Melodic Minor',
  'Pentatonic Major',
  'Pentatonic Minor',
  'Blues'
];

export const STANDARD_PITCH_CLASSES: Record<string, number[]> = {
  'Major': [0, 2, 4, 5, 7, 9, 11],
  'Dorian': [0, 2, 3, 5, 7, 9, 10],
  'Phrygian': [0, 1, 3, 5, 7, 8, 10],
  'Lydian': [0, 2, 4, 6, 7, 9, 11],
  'Mixolydian': [0, 2, 4, 5, 7, 9, 10],
  'Natural Minor': [0, 2, 3, 5, 7, 8, 10],
  'Locrian': [0, 1, 3, 5, 6, 8, 10],
  'Harmonic Minor': [0, 2, 3, 5, 7, 8, 11],
  'Melodic Minor': [0, 2, 3, 5, 7, 9, 11],
  'Pentatonic Major': [0, 2, 4, 7, 9],
  'Pentatonic Minor': [0, 3, 5, 7, 10],
  'Blues': [0, 3, 5, 6, 7, 10]
};

export const NOTE_TO_PC: Record<string, number> = {
  'C': 0, 'C#': 1, 'Db': 1, 'D': 2, 'D#': 3, 'Eb': 3, 'E': 4, 'F': 5, 'F#': 6, 'Gb': 6, 'G': 7, 'G#': 8, 'Ab': 8, 'A': 9, 'A#': 10, 'Bb': 10, 'B': 11, 'Cb': 11
};

const containerStyle: React.CSSProperties = {
  display: 'flex',
  width: '567px',
  position: 'relative',
  boxShadow: '0 10px 30px rgba(0,0,0,0.15)',
  overflow: 'visible'
};

const getWhiteStyle = (isSelected: boolean): React.CSSProperties => ({
  width: '81px',
  height: '118px',
  backgroundColor: isSelected ? '#FFD700' : '#fff',
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
  paddingBottom: '9px', // Scaled up for breathing room
  boxSizing: 'border-box',
  marginTop: '-1px',
  borderBottomLeftRadius: '6px', // Scaled slightly
  borderBottomRightRadius: '6px',
  boxShadow: isSelected ? 'inset 0 -5px 10px rgba(0,0,0,0.1), 0 4px 12px #FFD700' : 'none',
  fontFamily: "'Roboto Mono', monospace"
});

const getBlackStyle = (isSelected: boolean): React.CSSProperties => ({
  position: 'absolute',
  top: '-1px',
  right: '-24.75px', // Perfectly centers the 49.5px key on the right seam
  width: '49.5px',
  height: '75px',

  backgroundColor: isSelected ? '#FFD700' : '#000',
  zIndex: 10,
  borderBottom: isSelected ? '1px solid #000' : '13.5px solid #000', // Scaled bevel
  borderLeft: '1px solid #333',
  borderRight: '1px solid #333',
  cursor: 'pointer',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'flex-end',
  alignItems: 'center',
  paddingBottom: '6px', // Scaled up
  boxSizing: 'border-box',
  borderBottomLeftRadius: '3px',
  borderBottomRightRadius: '3px',
  boxShadow: isSelected ? 'inset 0 -5px 10px rgba(0,0,0,0.1), 0 4px 12px #FFD700' : 'none',
  fontFamily: "'Roboto Mono', monospace"
});

const ScaleKeySwitches12: React.FC = () => {
  const scales = useMidiStore((state) => state.activeState.keySwitches);
  const setScalesStore = useMidiStore((state) => state.setKeySwitches);
  
  const setScales = (updater: ScaleSwitchData[] | ((prev: ScaleSwitchData[]) => ScaleSwitchData[])) => {
    const current = useMidiStore.getState().activeState.keySwitches;
    const next = typeof updater === 'function' ? updater(current) : updater;
    setScalesStore(next);
  };
  
  const selectedIndex = useMidiStore((state) => state.activeState.activeSwitchIndex);
  
  const [isRootMenuOpen, setIsRootMenuOpen] = useState<boolean>(false);
  const [isTypeMenuOpen, setIsTypeMenuOpen] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [rootMenuCoords, setRootMenuCoords] = useState({ top: 0, left: 0 });
  const [typeMenuCoords, setTypeMenuCoords] = useState({ top: 0, left: 0 });

  const rootMenuRef = useRef<HTMLDivElement>(null);
  
  const activeScale = scales[selectedIndex];

  // Explicit push to Zustand — called ONLY on human click events, never passively
  const pushScaleToStore = (scaleObj: ScaleSwitchData) => {
    const pcs = STANDARD_PITCH_CLASSES[scaleObj.type] || STANDARD_PITCH_CLASSES['Major'];
    const decimal = calculateBitmaskDecimal(pcs);
    const rootPC = NOTE_TO_PC[scaleObj.root] ?? 0;
    // PRP-31: Route through setActiveState so computeNewLastPlayedMidi engine fires
    useMidiStore.getState().setActiveState({
      scaleDecimalId: decimal,
      rootNote: rootPC,
    });
  };

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (rootMenuRef.current && !rootMenuRef.current.contains(e.target as Node)) {
        setIsRootMenuOpen(false);
      }
    };
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsRootMenuOpen(false);
    };

    if (isRootMenuOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
      document.addEventListener('keydown', handleEscape);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isRootMenuOpen]);

  const whiteNotes = [0, 2, 4, 5, 7, 9, 11];
  const nestedBlackMap: Record<number, number> = {
    0: 1,  // C# nested in C
    2: 3,  // D# nested in D
    5: 6,  // F# nested in F
    7: 8,  // G# nested in G
    9: 10  // A# nested in A
  };

  const handleRootSelect = (newRoot: string) => {
    const updated = [...scales];
    updated[selectedIndex] = { ...updated[selectedIndex], root: newRoot };
    setScales(updated);
    setIsRootMenuOpen(false);
    pushScaleToStore(updated[selectedIndex]);
  };

  const handleTypeSelect = (newType: string) => {
    const updated = [...scales];
    updated[selectedIndex] = { ...updated[selectedIndex], type: newType };
    setScales(updated);
    setIsTypeMenuOpen(false);
    pushScaleToStore(updated[selectedIndex]);
  };

  return (
    <div 
      data-scales-count={scales.length}
      data-selected-index={selectedIndex}
      style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', backgroundColor: 'transparent', padding: '0px', width: '567px' }}
      className="h-full justify-between"
    >
      {/* Top Strip */}
      <div 
        id="scale-key-switches-strip"
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
        <span 
          data-testid="top-strip-root"
          className="cursor-pointer hover:opacity-75 text-orange-500 px-1"
          style={{ position: 'relative' }}
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            // Anchor to bottom center of the trigger
            setRootMenuCoords({ 
              top: rect.bottom + window.scrollY + 8, 
              left: rect.left + window.scrollX + (rect.width / 2) 
            });
            setIsRootMenuOpen(!isRootMenuOpen);
            setIsTypeMenuOpen(false);
          }}
        >
          {activeScale.root}
        </span>
        <span className="mx-1.5 font-normal text-gray-400">|</span>
        <span 
          data-testid="top-strip-type"
          className="cursor-pointer hover:opacity-75 text-black px-1"
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            // Anchor to bottom right of the trigger
            setTypeMenuCoords({ 
              top: rect.bottom + window.scrollY + 8, 
              left: rect.right + window.scrollX 
            });
            setIsTypeMenuOpen(!isTypeMenuOpen);
            setIsRootMenuOpen(false);
          }}
        >
          {activeScale.type}
        </span>

        <button
          id="scale-change-settings-cog"
          onClick={(e) => { e.stopPropagation(); setIsSettingsOpen(true); }}
          style={{ position: 'absolute', right: '12px' }}
          className="p-1 text-gray-400 hover:text-gray-800 transition-colors cursor-pointer"
          title="Scale Change Settings"
        >
          <Settings className="w-4 h-4" />
        </button>
      </div>

      {/* Keyboard Layout */}
      <div style={containerStyle}>
        {whiteNotes.map((noteIndex) => {
          const isSelected = selectedIndex === noteIndex;
          const blackIndex = nestedBlackMap[noteIndex];

          return (
            <div
              key={noteIndex}
              data-key-type="white"
              data-key-index={noteIndex}
              style={getWhiteStyle(isSelected)}
              onClick={() => {
                // PRP-31: Route through setActiveState (bundles index + scale/root atomically)
                const pcs = STANDARD_PITCH_CLASSES[scales[noteIndex].type] || STANDARD_PITCH_CLASSES['Major'];
                const decimal = calculateBitmaskDecimal(pcs);
                const rootPC = NOTE_TO_PC[scales[noteIndex].root] ?? 0;
                useMidiStore.getState().setActiveState({
                  activeSwitchIndex: noteIndex,
                  scaleDecimalId: decimal,
                  rootNote: rootPC,
                });
                setIsRootMenuOpen(false);
                setIsTypeMenuOpen(false);
              }}
            >
              {/* White key text labels */}
              <div className="text-[15px] text-center leading-none text-black select-none pointer-events-none">
                <div className="font-bold text-orange-500">{scales[noteIndex].root}</div>
                <div style={{ fontSize: '12px' }} className="mt-0.5 opacity-80">{scales[noteIndex].type}</div>
              </div>

              {/* Nested Black Key */}
              {blackIndex !== undefined && (
                <div
                  data-key-type="black"
                  data-key-index={blackIndex}
                  style={getBlackStyle(selectedIndex === blackIndex)}
                  onClick={(e) => {
                    e.stopPropagation();
                    // PRP-31: Route through setActiveState (bundles index + scale/root atomically)
                    const pcs = STANDARD_PITCH_CLASSES[scales[blackIndex].type] || STANDARD_PITCH_CLASSES['Major'];
                    const decimal = calculateBitmaskDecimal(pcs);
                    const rootPC = NOTE_TO_PC[scales[blackIndex].root] ?? 0;
                    useMidiStore.getState().setActiveState({
                      activeSwitchIndex: blackIndex,
                      scaleDecimalId: decimal,
                      rootNote: rootPC,
                    });
                    setIsRootMenuOpen(false);
                    setIsTypeMenuOpen(false);
                  }}
                >
                  <div className={`text-[12px] text-center leading-none select-none pointer-events-none ${selectedIndex === blackIndex ? 'text-black' : 'text-white'}`}>
                    <div className="font-bold text-orange-500">{scales[blackIndex].root}</div>
                    <div style={{ fontSize: '9px' }} className="mt-0.5 opacity-80">{scales[blackIndex].type}</div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
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
      </div>
      <ScaleChangeSettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />

      {isRootMenuOpen && createPortal(
        <div 
          ref={rootMenuRef}
          onClick={(e) => e.stopPropagation()}
          style={{
            position: 'absolute',
            top: `${rootMenuCoords.top}px`,
            left: `${rootMenuCoords.left}px`,
            transform: 'translateX(-50%)',
            width: '120px',
            maxHeight: '300px',
            overflowY: 'auto',
            backgroundColor: '#222',
            border: '1px solid #444',
            borderRadius: '4px',
            zIndex: 9999, // Ensure it sits above everything
            boxShadow: '0 8px 16px rgba(0,0,0,0.5)',
            fontFamily: "'Roboto Mono', monospace"
          }}
        >
          {CYCLE_OF_FIFTHS.map(root => {
            const isCurrentSelection = root === activeScale.root;
            return (
              <div
                key={root}
                data-testid={`root-option-${root}`}
                className={`px-3 py-1.5 text-sm cursor-pointer hover:bg-blue-600 hover:text-white ${isCurrentSelection ? 'font-bold text-white' : 'text-white'}`}
                style={{
                  backgroundColor: isCurrentSelection ? '#444' : undefined
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  handleRootSelect(root);
                }}
              >
                {root}
              </div>
            );
          })}
        </div>,
        document.body
      )}

      {isTypeMenuOpen && createPortal(
        <div 
          onClick={(e) => e.stopPropagation()}
          style={{
            position: 'absolute',
            top: `${typeMenuCoords.top}px`,
            left: `${typeMenuCoords.left}px`,
            transform: 'translateX(-100%)', // align right edge
            width: '160px',
            maxHeight: '200px',
            overflowY: 'auto',
            backgroundColor: '#222',
            border: '1px solid #444',
            borderRadius: '4px',
            zIndex: 9999,
            boxShadow: '0 8px 16px rgba(0,0,0,0.5)',
            fontFamily: "'Roboto Mono', monospace"
          }}
        >
          {TYPE_OPTIONS.map(type => (
            <div
              key={type}
              data-testid={`type-option-${type}`}
              className="px-3 py-1.5 text-sm text-white cursor-pointer hover:bg-emerald-600 hover:text-white"
              onClick={() => handleTypeSelect(type)}
            >
              {type}
            </div>
          ))}
        </div>,
        document.body
      )}
    </div>
  );
};

export default ScaleKeySwitches12;
