import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { Check, ChevronUp, ChevronDown } from 'lucide-react';
import { AppState } from '../types';

const STEPS = [
  { id: 'intake', label: 'Intake', condition: (state: AppState) => !!state.caseGlance },
  { id: 'issueTree', label: 'Structure', condition: (state: AppState) => !!state.issueTree },
  { id: 'frameworks', label: 'Framework', condition: (state: AppState) => !!state.frameworks },
  { id: 'drafter', label: 'Draft', condition: (state: AppState) => !!state.expandedRecommendation },
  { id: 'slideOutline', label: 'Slides', condition: (state: AppState) => !!state.slideOutline }
];

export const ProgressBar: React.FC = () => {
  const { appState } = useAppContext();
  const [isCollapsed, setIsCollapsed] = useState(() => {
    return localStorage.getItem('hide-progress-bar') === 'true';
  });

  const handleToggle = () => {
    const newState = !isCollapsed;
    setIsCollapsed(newState);
    localStorage.setItem('hide-progress-bar', String(newState));
  };

  const completedCount = STEPS.filter(step => step.condition(appState)).length;
  const progressPercent = (completedCount / STEPS.length) * 100;

  if (isCollapsed) {
    return (
      <div className="w-full max-w-5xl mx-auto px-6 sm:px-8 pt-2 pb-1 shrink-0 flex items-center gap-4">
        {/* Sleek thin progress track */}
        <div className="flex-1 h-1 bg-slate-800 rounded-full overflow-hidden relative">
          <div 
            className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full transition-all duration-500 shadow-[0_0_8px_rgba(56,189,248,0.5)]" 
            style={{ width: `${progressPercent}%` }} 
          />
        </div>
        {/* Toggle Button */}
        <button 
          onClick={handleToggle}
          className="p-1 hover:bg-slate-800/50 rounded text-slate-500 hover:text-slate-350 transition-colors cursor-pointer"
          title="Expand Progress Bar"
        >
          <ChevronDown className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-5xl mx-auto px-6 sm:px-8 pt-2.5 pb-1 shrink-0 flex items-start gap-4">
      <div className="flex-1 flex items-start justify-between relative pt-1">
        {/* Background track connecting centers */}
        <div className="absolute left-[5%] right-[5%] top-[9px] -translate-y-1/2 h-px bg-slate-800 z-0"></div>
        
        {STEPS.map((step, index) => {
          const isCompleted = step.condition(appState);
          // A step is active if the previous step is completed, but this step is not.
          // The first step is active by default if not completed.
          const isActive = !isCompleted && (index === 0 || STEPS[index - 1].condition(appState));

          return (
            <div key={step.id} className="relative z-10 flex flex-col items-center flex-1">
              <div 
                className={`w-[18px] h-[18px] rounded-full border flex items-center justify-center transition-all duration-500 bg-[#0f172a] mb-1 ${
                  isCompleted 
                    ? 'border-blue-500 bg-blue-500/10 text-blue-400' 
                    : isActive 
                      ? 'border-cyan-400 text-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.25)]'
                      : 'border-slate-850 text-slate-800'
                }`}
              >
                {isCompleted ? (
                  <Check className="w-2.5 h-2.5 text-blue-400" strokeWidth={3.5} />
                ) : (
                  <div className={`w-1.5 h-1.5 rounded-full transition-colors ${isActive ? 'bg-cyan-400' : 'bg-transparent'}`} />
                )}
              </div>
              <span className={`whitespace-nowrap text-[10px] uppercase tracking-wider font-bold transition-colors duration-300 ${
                isCompleted ? 'text-blue-400 text-opacity-80' : isActive ? 'text-slate-200' : 'text-slate-700'
              }`}>
                {step.label}
              </span>

              {/* Progress fill line connecting to the next step */}
              {index < STEPS.length - 1 && (
                <div className="absolute left-[50%] right-[-50%] top-[9px] -translate-y-1/2 h-px -z-10 overflow-hidden">
                  <div 
                    className={`h-full bg-blue-500 transition-all duration-700 ease-out ${
                      isCompleted ? 'w-full' : 'w-0'
                    }`} 
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
      {/* Toggle Button */}
      <button 
        onClick={handleToggle}
        className="p-1 hover:bg-slate-800/50 rounded text-slate-500 hover:text-slate-350 transition-colors cursor-pointer mt-0.5"
        title="Collapse Progress Bar"
      >
        <ChevronUp className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};
