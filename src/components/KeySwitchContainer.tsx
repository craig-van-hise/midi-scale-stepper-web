import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import ScaleKeySwitches12 from './ScaleKeySwitches12';
import ScaleStepperKeySwitches24 from './ScaleStepperKeySwitches24';

export default function KeySwitchContainer() {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div 
      id="keyswitch-container-card"
      className={`relative bg-white rounded-lg shadow-[0_8px_24px_rgba(0,0,0,0.15)] outline-none w-[1020px] flex flex-col focus:ring-4 ring-blue-100 select-none transition-all duration-300 ${isCollapsed ? 'h-[40px] pt-[10px] px-[16px]' : 'pt-4 pb-[16px] px-[16px]'}`}
    >
      {/* Header / Collapse Toggle */}
      <div 
        className={`flex items-center gap-1.5 cursor-pointer z-30 opacity-70 hover:opacity-100 transition-opacity font-sans ${isCollapsed ? '' : 'mb-4'}`}
        onClick={() => setIsCollapsed(!isCollapsed)}
        title="Toggle Key Switches"
      >
        {isCollapsed ? (
          <ChevronDown className="w-4 h-4 text-gray-700" strokeWidth={2.5} />
        ) : (
          <ChevronUp className="w-4 h-4 text-gray-700" strokeWidth={2.5} />
        )}
        <span className="font-semibold text-[14px] text-gray-700 select-none font-sans">Key switches</span>
      </div>
      
      {!isCollapsed && (
        <div className="w-full flex justify-center overflow-hidden h-[138px]">
          <div 
            className="flex flex-row items-start justify-start gap-6"
            style={{
              transform: 'scale(0.80)',
              transformOrigin: 'top center',
              width: '1199px',
              flexShrink: 0
            }}
          >
            <div style={{ flexShrink: 0 }}>
              <ScaleKeySwitches12 />
            </div>
            <div style={{ flexShrink: 0 }}>
              <ScaleStepperKeySwitches24 />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
