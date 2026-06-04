import { createPortal } from 'react-dom';
import { useMidiStore } from '../store/useMidiStore';
import { X } from 'lucide-react';

interface InputSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function InputSettingsModal({ isOpen, onClose }: InputSettingsModalProps) {
  const inputKeyboardSize = useMidiStore((state) => state.globalSettings.inputKeyboardSize || 88);
  const setInputKeyboardSize = useMidiStore((state) => state.setInputKeyboardSize);

  if (!isOpen) return null;

  return createPortal(
    <div 
      id="input-settings-modal"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-2xl shadow-2xl max-w-sm w-full border border-gray-100 p-6 relative flex flex-col font-sans"
        onClick={(e) => e.stopPropagation()}
      >
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-1 text-gray-400 hover:text-gray-600 transition-colors"
          aria-label="Close settings"
        >
          <X className="w-5 h-5" />
        </button>

        <h2 className="text-xl font-bold font-display text-gray-800 mb-6">
          Input Keyboard Settings
        </h2>

        <div className="space-y-4 mb-8">
          <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4">
            PHYSICAL CONTROLLER SIZE
          </h3>
          
          <label className="flex items-center gap-3 cursor-pointer">
            <input 
              id="input-keyboard-size-88-button"
              type="radio" 
              name="inputKeyboardSize"
              value="88"
              checked={inputKeyboardSize === 88}
              onChange={() => setInputKeyboardSize(88)}
              className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500 cursor-pointer"
            />
            <span className="text-sm font-semibold text-gray-800">88-Key Controller</span>
          </label>

          <label className="flex items-center gap-3 cursor-pointer">
            <input 
              id="input-keyboard-size-49-button"
              type="radio" 
              name="inputKeyboardSize"
              value="49"
              checked={inputKeyboardSize === 49}
              onChange={() => setInputKeyboardSize(49)}
              className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500 cursor-pointer"
            />
            <span className="text-sm font-semibold text-gray-800">49-Key Controller (Truncated C2-C6)</span>
          </label>
        </div>

        <button
          id="close-input-settings-button"
          onClick={onClose}
          className="w-full py-2.5 bg-gray-950 hover:bg-gray-900 text-white font-semibold rounded-lg text-sm transition-colors cursor-pointer"
        >
          Done
        </button>
      </div>
    </div>,
    document.body
  );
}
