import { useMidiStore } from '../store/useMidiStore';
import { Ear, X } from 'lucide-react';

interface HomeSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function HomeSettingsModal({ isOpen, onClose }: HomeSettingsModalProps) {
  const homeSettings = useMidiStore((state) => state.homeSettings);
  const updateHomeSettings = useMidiStore((state) => state.updateHomeSettings);

  if (!isOpen) return null;

  return (
    <div 
      id="home-settings-modal"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-2xl shadow-2xl max-w-sm w-full border border-gray-100 p-6 relative flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-1 text-gray-400 hover:text-gray-600 transition-colors"
          aria-label="Close settings"
        >
          <X className="w-5 h-5" />
        </button>

        <h2 className="text-xl font-bold font-display text-gray-800 mb-4">
          Home Switch Settings
        </h2>

        <div className="space-y-4">
          {/* Audible Selection Toggle */}
          <div className="flex items-center justify-between py-2 border-b border-gray-100">
            <div className="flex items-center gap-2.5">
              <Ear className="w-5 h-5 text-gray-500" />
              <div>
                <span className="block text-sm font-semibold text-gray-700">Audible Selection</span>
                <span className="block text-xs text-gray-400">Play the root note on reset</span>
              </div>
            </div>
            <button
              id="toggle-home-audible"
              type="button"
              onClick={() => updateHomeSettings({ audible: !homeSettings.audible })}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                homeSettings.audible ? 'bg-amber-800' : 'bg-gray-200'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                  homeSettings.audible ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>

        <button
          onClick={onClose}
          className="mt-6 w-full py-2.5 bg-gray-950 hover:bg-gray-900 text-white font-semibold rounded-lg text-sm transition-colors cursor-pointer"
        >
          Done
        </button>
      </div>
    </div>
  );
}
