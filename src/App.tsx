import { useEffect, useState } from 'react';
import { useWebMidi } from './hooks/useWebMidi';
import { useSynth } from './hooks/useSynth';
import { initializeLUT } from './utils/lutRegistry';
import Header from './components/Header';
import SettingsModal from './components/SettingsModal';
import InfoModal from './components/InfoModal';
import KeySplitKeyboard from './components/KeySplitKeyboard';
import KeySwitchContainer from './components/KeySwitchContainer';
import { ScaleInspectorNotation } from './components/ScaleInspectorNotation';
import { NoteRangeFilterKeyboard } from './components/NoteRangeFilterKeyboard';
import { useMidiStore } from './store/useMidiStore';

export default function App() {
  const { inputs, error, loading } = useWebMidi();
  useSynth();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isInfoOpen, setIsInfoOpen] = useState(false);

  const activeState = useMidiStore((state) => state.activeState);
  const setLutReady = useMidiStore((state) => state.setLutReady);
  const power = useMidiStore((state) => state.globalSettings.power);

  // Initialize the scale lookup table on mount — signal store when done
  useEffect(() => {
    initializeLUT()
      .then(() => setLutReady(true))
      .catch((err) => {
        console.error('Failed to initialize scale LUT:', err);
      });
  }, [setLutReady]);

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 pb-12">
      {/* Top Header */}
      <Header 
        inputs={inputs} 
        onOpenSettings={() => setIsSettingsOpen(true)} 
        onOpenInfo={() => setIsInfoOpen(true)} 
      />

      {/* Main Layout */}
      <main className={`flex-1 flex flex-col items-center gap-3 px-4 md:px-8 py-8 max-w-[1600px] w-full mx-auto transition-all duration-300 ${
        !power ? 'opacity-50 pointer-events-none select-none grayscale-[0.5]' : ''
      }`}>
        {/* MIDI Connection Status Card */}
        {error && (
          <div className="w-full max-w-md bg-red-50 border border-red-200 rounded-xl p-4 text-red-600 font-semibold text-sm">
            Error: {error}
          </div>
        )}

        {/* Input Keyboard splits component */}
        <div className="w-full flex justify-center">
          <KeySplitKeyboard />
        </div>

        {/* KeySwitches & Stepper container */}
        <div className="w-full flex justify-center">
          <KeySwitchContainer />
        </div>

        {/* Scale Notation View */}
        <div className="w-full flex justify-center">
          <ScaleInspectorNotation />
        </div>

        {/* Output Keyboard Visualizer */}
        <div className="w-full flex justify-center">
          <NoteRangeFilterKeyboard />
        </div>

        {/* Debug / Status View Card */}
        <div className="w-full max-w-2xl bg-white rounded-2xl shadow-xl p-6 border border-gray-100 grid grid-cols-2 gap-4">
          <div>
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">
              System Info
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">MIDI Support:</span>
                {loading ? (
                  <span className="text-yellow-600 animate-pulse font-semibold">Initializing...</span>
                ) : (
                  <span className="text-green-600 font-semibold">Ready</span>
                )}
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Connected inputs:</span>
                <span className="font-semibold text-gray-800">{inputs.length}</span>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">
              Active State
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Root Note:</span>
                <span className="font-semibold text-gray-800">
                  {activeState.rootNote !== null ? activeState.rootNote : 'None'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Scale Decimal ID:</span>
                <span className="font-semibold text-gray-800">
                  {activeState.scaleDecimalId !== null ? activeState.scaleDecimalId : 'None'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Modals */}
      <SettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)} 
        inputs={inputs} 
      />
      <InfoModal 
        isOpen={isInfoOpen} 
        onClose={() => setIsInfoOpen(false)} 
      />
    </div>
  );
}
