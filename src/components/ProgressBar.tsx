import React from 'react';
import { useAppContext } from '../context/AppContext';
import { Check } from 'lucide-react';
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

  return (
    <div className="w-full max-w-5xl mx-auto px-6 sm:px-8 pt-6 pb-2 shrink-0">
      <div className="flex items-start justify-between relative pt-2">
        {/* Background track connecting centers */}
        <div className="absolute left-[5%] right-[5%] top-5 -translate-y-1/2 h-px bg-slate-800 z-0"></div>
        
        {STEPS.map((step, index) => {
          const isCompleted = step.condition(appState);
          // A step is active if the previous step is completed, but this step is not.
          // The first step is active by default if not completed.
          const isActive = !isCompleted && (index === 0 || STEPS[index - 1].condition(appState));

          return (
            <div key={step.id} className="relative z-10 flex flex-col items-center flex-1">
              <div 
                className={`w-6 h-6 rounded-full border flex items-center justify-center transition-all duration-500 bg-[#0f172a] mb-2 ${
                  isCompleted 
                    ? 'border-blue-500 bg-blue-500/10 text-blue-400' 
                    : isActive 
                      ? 'border-cyan-400 text-cyan-400 shadow-[0_0_12px_rgba(34,211,238,0.2)]'
                      : 'border-slate-800 text-slate-800'
                }`}
              >
                {isCompleted ? (
                  <Check className="w-3 h-3 text-blue-400" strokeWidth={3} />
                ) : (
                  <div className={`w-1.5 h-1.5 rounded-full transition-colors ${isActive ? 'bg-cyan-400' : 'bg-transparent'}`} />
                )}
              </div>
              <span className={`whitespace-nowrap text-[9px] uppercase tracking-widest font-bold transition-colors duration-300 ${
                isCompleted ? 'text-blue-400 text-opacity-80' : isActive ? 'text-slate-200' : 'text-slate-700'
              }`}>
                {step.label}
              </span>

              {/* Progress fill line connecting to the next step */}
              {index < STEPS.length - 1 && (
                <div className="absolute left-[50%] right-[-50%] top-3 -translate-y-1/2 h-px -z-10 overflow-hidden">
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
    </div>
  );
};
