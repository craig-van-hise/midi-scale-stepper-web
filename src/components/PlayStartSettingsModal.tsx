import React from 'react';
import { useMidiStore } from '../store/useMidiStore';
import { Ear, Sparkles, X } from 'lucide-react';

interface PlayStartSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function PlayStartSettingsModal({ isOpen, onClose }: PlayStartSettingsModalProps) {
  const playStartSettings = useMidiStore((state) => state.playStartSettings);
  const updatePlayStartSettings = useMidiStore((state) => state.updatePlayStartSettings);

  if (!isOpen) return null;

  return (
    <div 
      id="play-start-settings-modal"
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
          Play/Start Note Settings
        </h2>

        <div className="space-y-4">
          {/* Audible Selection Toggle */}
          <div className="flex items-center justify-between py-2 border-b border-gray-100">
            <div className="flex items-center gap-2.5">
              <Ear className="w-5 h-5 text-gray-500" />
              <div>
                <span className="block text-sm font-semibold text-gray-700">Audible Selection</span>
                <span className="block text-xs text-gray-400">Play notes audibly</span>
              </div>
            </div>
            <button
              id="toggle-audible"
              type="button"
              onClick={() => updatePlayStartSettings({ audible: !playStartSettings.audible })}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                playStartSettings.audible ? 'bg-blue-600' : 'bg-gray-200'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                  playStartSettings.audible ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Apply Scale Rounding Toggle */}
          <div className="flex items-center justify-between py-2">
            <div className="flex items-center gap-2.5">
              <Sparkles className="w-5 h-5 text-gray-500" />
              <div>
                <span className="block text-sm font-semibold text-gray-700">Apply Scale Rounding</span>
                <span className="block text-xs text-gray-400">Snap to active scale pitch classes</span>
              </div>
            </div>
            <button
              id="toggle-rounded"
              type="button"
              onClick={() => updatePlayStartSettings({ rounded: !playStartSettings.rounded })}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                playStartSettings.rounded ? 'bg-blue-600' : 'bg-gray-200'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                  playStartSettings.rounded ? 'translate-x-5' : 'translate-x-0'
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
