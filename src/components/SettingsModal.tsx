import { useMidiStore } from '../store/useMidiStore';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  inputs: MIDIInput[];
}

export default function SettingsModal({ isOpen, onClose, inputs }: SettingsModalProps) {
  const globalSettings = useMidiStore((state) => state.globalSettings);
  const setMidiInPort = useMidiStore((state) => state.setMidiInPort);
  const setChannelFilter = useMidiStore((state) => state.setChannelFilter);
  const setStartOctave = useMidiStore((state) => state.setStartOctave);
  const setRoundPreference = useMidiStore((state) => state.setRoundPreference);

  if (!isOpen) return null;

  return (
    <div 
      id="settings-modal"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-gray-100 p-6 relative"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-2xl font-bold font-display text-gray-800 mb-6">
          MIDI Settings
        </h2>

        <div className="space-y-5">
          {/* Web MIDI Input Port Selector */}
          <div>
            <label id="midi-port-label" className="block text-sm font-semibold text-gray-600 mb-1.5">
              MIDI Input Port
            </label>
            <select
              id="midi-port-select"
              value={globalSettings.midiInPort || ''}
              onChange={(e) => setMidiInPort(e.target.value || null)}
              className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2.5 text-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
            >
              <option value="">-- No Device Selected --</option>
              {inputs.map((input) => (
                <option key={input.id} value={input.id}>
                  {input.name || `Device ${input.id}`}
                </option>
              ))}
            </select>
          </div>

          {/* Channel Filter */}
          <div>
            <label id="channel-filter-label" className="block text-sm font-semibold text-gray-600 mb-1.5">
              MIDI Channel Filter
            </label>
            <select
              id="channel-filter-select"
              value={globalSettings.channelFilter}
              onChange={(e) => {
                const val = e.target.value;
                setChannelFilter(val === 'ALL' ? 'ALL' : parseInt(val, 10));
              }}
              className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2.5 text-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
            >
              <option value="ALL">All Channels</option>
              {Array.from({ length: 16 }, (_, i) => (
                <option key={i} value={i}>
                  Channel {i + 1}
                </option>
              ))}
            </select>
          </div>

          {/* Starting Octave */}
          <div>
            <label id="start-octave-label" className="block text-sm font-semibold text-gray-600 mb-1.5">
              Starting Octave (0-7)
            </label>
            <input
              id="start-octave-input"
              type="number"
              min="0"
              max="7"
              value={globalSettings.startOctave}
              onChange={(e) => setStartOctave(parseInt(e.target.value, 10) || 0)}
              className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2.5 text-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
            />
          </div>

          {/* Rounding Preference */}
          <div>
            <span id="rounding-preference-label" className="block text-sm font-semibold text-gray-600 mb-2">
              Rounding Preference
            </span>
            <div className="flex bg-gray-50 border border-gray-200 rounded-lg p-1">
              <button
                id="round-up-button"
                type="button"
                onClick={() => setRoundPreference('UP')}
                className={`flex-1 text-center py-2 text-sm font-medium rounded-md transition-colors ${
                  globalSettings.roundPreference === 'UP'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100/50'
                }`}
              >
                Round Up
              </button>
              <button
                id="round-down-button"
                type="button"
                onClick={() => setRoundPreference('DOWN')}
                className={`flex-1 text-center py-2 text-sm font-medium rounded-md transition-colors ${
                  globalSettings.roundPreference === 'DOWN'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100/50'
                }`}
              >
                Round Down
              </button>
            </div>
          </div>
        </div>

        <button
          id="close-settings-button"
          onClick={onClose}
          className="mt-6 w-full py-2.5 bg-gray-950 hover:bg-gray-900 text-white font-semibold rounded-lg text-sm transition-colors cursor-pointer"
        >
          Done
        </button>
      </div>
    </div>
  );
}
