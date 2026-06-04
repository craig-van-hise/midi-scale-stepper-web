import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useMidiStore } from '../store/useMidiStore';
import type { StepperAction, StepperActionType } from '../types/midi';

interface StepperContextMenuProps {
  x: number;
  y: number;
  index: number;
  initialAction: StepperAction;
  onClose: () => void;
}

const ACTION_TYPES: { value: StepperActionType; label: string }[] = [
  { value: 'STEP', label: 'Step Offset' },
  { value: 'OCTAVE', label: 'Octave Offset' },
  { value: 'INVERT_TOGGLE', label: 'Invert Toggle' },
  { value: 'INVERT_MOMENTARY', label: 'Invert Momentary' },
  { value: 'HOME', label: 'Home Reset' },
  { value: 'REPEAT_LAST', label: 'Repeat Last Action' },
  { value: 'CUSTOM', label: 'Custom Bypass' },
];

export const generateLabel = (type: StepperActionType, value: number): string => {
  switch (type) {
    case 'STEP': return value > 0 ? `+${value}` : `${value}`;
    case 'OCTAVE': return value > 0 ? '+Oct' : '-Oct';
    case 'HOME': return 'Home';
    case 'INVERT_TOGGLE': return 'Inv(T)';
    case 'INVERT_MOMENTARY': return 'Inv(M)';
    case 'REPEAT_LAST': return 'Repeat';
    case 'CUSTOM': return 'Open';
    default: return '';
  }
};

export default function StepperContextMenu({
  x,
  y,
  index,
  initialAction,
  onClose,
}: StepperContextMenuProps) {
  const [type, setType] = useState<StepperActionType>(initialAction.type);
  const [valueStr, setValueStr] = useState<string>(initialAction.value.toString());

  const containerRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside
  useEffect(() => {
    const handleMouseDown = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleMouseDown);
    return () => {
      document.removeEventListener('mousedown', handleMouseDown);
    };
  }, [onClose]);

  const handleSave = () => {
    const parsedValue = parseInt(valueStr, 10) || 0;
    const finalLabel = generateLabel(type, parsedValue);
    useMidiStore.getState().updateStepperConfig(index, {
      type,
      value: parsedValue,
      label: finalLabel,
    });
    onClose();
  };

  const isValueDisabled = type !== 'STEP' && type !== 'OCTAVE';

  return createPortal(
    <div
      ref={containerRef}
      id="stepper-context-menu"
      className="absolute bg-white border border-gray-200 rounded-xl shadow-2xl p-4 font-sans text-sm w-64 flex flex-col gap-3"
      style={{
        top: `${y}px`,
        left: `${x}px`,
        zIndex: 9999,
      }}
      onKeyDown={(e) => {
        e.stopPropagation();
        if (e.key === 'Enter') {
          handleSave();
        }
      }}
    >
      <div className="flex flex-col gap-1">
        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">
          Action Type
        </label>
        <select
          id="stepper-action-type-select"
          value={type}
          onChange={(e) => setType(e.target.value as StepperActionType)}
          className="w-full px-2.5 py-1.5 border border-gray-300 rounded-lg text-gray-800 bg-white focus:outline-none focus:border-blue-500 cursor-pointer"
        >
          {ACTION_TYPES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">
          Value Offset
        </label>
        <input
          id="stepper-value-input"
          type="number"
          value={valueStr}
          disabled={isValueDisabled}
          onChange={(e) => setValueStr(e.target.value)}
          onKeyDown={(e) => {
            e.stopPropagation();
            if (e.key === 'Enter') {
              handleSave();
            }
          }}
          className="w-full px-2.5 py-1.5 border border-gray-300 rounded-lg text-gray-800 focus:outline-none focus:border-blue-500 disabled:bg-gray-100 disabled:text-gray-400"
        />
      </div>

      <div className="flex gap-2 justify-end mt-2">
        <button
          id="stepper-cancel-button"
          onClick={onClose}
          className="px-3 py-1.5 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors cursor-pointer text-xs font-semibold"
        >
          Cancel
        </button>
        <button
          id="stepper-save-button"
          onClick={handleSave}
          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors cursor-pointer text-xs font-semibold"
        >
          Save
        </button>
      </div>
    </div>,
    document.body
  );
}
