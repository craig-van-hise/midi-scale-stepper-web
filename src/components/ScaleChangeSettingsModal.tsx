import { createPortal } from 'react-dom';
import { useMidiStore } from '../store/useMidiStore';

interface ScaleChangeSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ScaleChangeSettingsModal({ isOpen, onClose }: ScaleChangeSettingsModalProps) {
  const scaleChangeMode = useMidiStore((state) => state.scaleChangeMode);
  const setScaleChangeMode = useMidiStore((state) => state.setScaleChangeMode);

  if (!isOpen) return null;

  return createPortal(
    <div 
      id="scale-change-settings-modal"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-2xl shadow-2xl max-w-sm w-full border border-gray-100 p-6 relative flex flex-col font-sans"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-xl font-bold font-display text-gray-800 mb-6">
          Scale Change Settings
        </h2>

        <div className="space-y-4 mb-8">
          <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4">
            BEHAVIOR MODE
          </h3>
          
          <label className="flex items-center gap-3 cursor-pointer">
            <input 
              id="scale-change-follow-root-button"
              type="radio" 
              name="scaleChangeMode"
              value="follow-root"
              checked={scaleChangeMode === 'follow-root'}
              onChange={() => setScaleChangeMode('follow-root')}
              className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500 cursor-pointer"
            />
            <span className="text-sm font-semibold text-gray-800">Follow Root</span>
          </label>

          <label className="flex items-center gap-3 cursor-pointer">
            <input 
              id="scale-change-voice-leading-button"
              type="radio" 
              name="scaleChangeMode"
              value="voice-leading"
              checked={scaleChangeMode === 'voice-leading'}
              onChange={() => setScaleChangeMode('voice-leading')}
              className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500 cursor-pointer"
            />
            <span className="text-sm font-semibold text-gray-800">Voice-Leading</span>
          </label>
        </div>

        <button
          id="close-scale-change-settings-button"
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
