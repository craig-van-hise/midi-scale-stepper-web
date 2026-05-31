
import { useMidiStore } from '../store/useMidiStore';
import { Power, Octagon, Info, Settings } from 'lucide-react';

interface HeaderProps {
  inputs: MIDIInput[];
  onOpenSettings: () => void;
  onOpenInfo: () => void;
}

export default function Header({ inputs, onOpenSettings, onOpenInfo }: HeaderProps) {
  const globalSettings = useMidiStore((state) => state.globalSettings);
  const setMidiInPort = useMidiStore((state) => state.setMidiInPort);
  const setPower = useMidiStore((state) => state.setPower);
  const panic = useMidiStore((state) => state.panic);

  return (
    <header className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between shadow-xs">
      {/* Left side: Title and Port Selector */}
      <div className="flex items-center gap-6">
        <h1 className="text-xl font-bold font-display tracking-tight text-gray-900">
          MIDI Scale Stepper
        </h1>

        <div className="hidden sm:flex items-center gap-2">
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
            Input:
          </span>
          <select
            id="header-midi-port-select"
            value={globalSettings.midiInPort || ''}
            onChange={(e) => setMidiInPort(e.target.value || null)}
            className="bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1.5 text-gray-800 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
          >
            <option value="">-- Select MIDI Input --</option>
            {inputs.map((input) => (
              <option key={input.id} value={input.id}>
                {input.name || `Device ${input.id}`}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Right side: Control Buttons */}
      <div className="flex items-center gap-2">
        {/* Power Toggle */}
        <button
          id="power-toggle-button"
          onClick={() => setPower(!globalSettings.power)}
          title={globalSettings.power ? 'Bypass On (Power active)' : 'Bypass Off (Power inactive)'}
          className={`p-2.5 rounded-lg border transition-all cursor-pointer ${
            globalSettings.power
              ? 'bg-emerald-50 border-emerald-200 text-emerald-600 hover:bg-emerald-100/80'
              : 'bg-gray-50 border-gray-200 text-gray-400 hover:bg-gray-100 hover:text-gray-600'
          }`}
        >
          <Power className="h-4 w-4" />
        </button>

        {/* Panic Button */}
        <button
          id="panic-button"
          onClick={() => panic()}
          title="Panic (Clear All Keys)"
          className="p-2.5 rounded-lg border border-red-200 bg-red-50 text-red-600 hover:bg-red-100/80 transition-all cursor-pointer"
        >
          <Octagon className="h-4 w-4" />
        </button>

        {/* Info Button */}
        <button
          id="info-toggle-button"
          onClick={onOpenInfo}
          title="About Info"
          className="p-2.5 rounded-lg border border-gray-200 bg-gray-50 text-gray-600 hover:bg-gray-100 hover:text-gray-800 transition-all cursor-pointer"
        >
          <Info className="h-4 w-4" />
        </button>

        {/* Settings Button */}
        <button
          id="settings-toggle-button"
          onClick={onOpenSettings}
          title="Settings Configuration"
          className="p-2.5 rounded-lg border border-gray-200 bg-gray-50 text-gray-600 hover:bg-gray-100 hover:text-gray-800 transition-all cursor-pointer"
        >
          <Settings className="h-4 w-4" />
        </button>
      </div>
    </header>
  );
}
