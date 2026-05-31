

interface InfoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function InfoModal({ isOpen, onClose }: InfoModalProps) {
  if (!isOpen) return null;

  return (
    <div 
      id="info-modal"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-gray-100 p-6 relative"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-2xl font-bold font-display text-gray-800 mb-4">
          About MIDI Scale Stepper
        </h2>

        <div className="space-y-4 text-sm text-gray-600 leading-relaxed">
          <p>
            The <strong>MIDI Scale Stepper MVP</strong> is a utility designed for musicians to map MIDI note inputs into scale steps and route them to specific output zones. It supports real-time MIDI parsing and scale-snapping.
          </p>

          <div className="border-t border-gray-100 pt-4">
            <span className="block font-semibold text-gray-700 mb-1">Developer</span>
            <span className="block text-gray-900 font-medium">Craig Van Hise</span>
          </div>

          <div className="border-t border-gray-100 pt-4 space-y-2">
            <a 
              id="info-link-website"
              href="https://virtualvirgin.net" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center text-blue-600 hover:text-blue-800 font-semibold gap-1 transition-colors"
            >
              virtualvirgin.net
            </a>
            <a 
              id="info-link-github"
              href="https://github.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center text-blue-600 hover:text-blue-800 font-semibold gap-1 transition-colors"
            >
              GitHub Project Repository
            </a>
          </div>
        </div>

        <button
          id="close-info-button"
          onClick={onClose}
          className="mt-6 w-full py-2.5 bg-gray-950 hover:bg-gray-900 text-white font-semibold rounded-lg text-sm transition-colors cursor-pointer"
        >
          Close
        </button>
      </div>
    </div>
  );
}
