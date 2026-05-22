import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { recommendFrameworks } from '../services/geminiService';
import { AppState, Framework } from '../types';
import { EmptyState } from './EmptyState';
import { ShimmerButton, CyclingLoadingText, TypewriterText } from './MicroInteractions';
import { Check, Pin } from 'lucide-react';
import { sounds } from '../lib/sounds';

import { useAppContext } from '../context/AppContext';

type Props = {
  onNext?: () => void;
  onGoBack?: () => void;
};

const BORDER_COLORS = [
  'border-l-blue-500',
  'border-l-emerald-500',
  'border-l-purple-500',
  'border-l-amber-500',
  'border-l-rose-500',
  'border-l-cyan-500'
];

export const FrameworksSection: React.FC<Props> = ({ onNext, onGoBack }) => {
  const { appState, setAppState } = useAppContext();
  const [isRecommending, setIsRecommending] = useState(false);

  useEffect(() => {
    if (appState.caseGlance?.coreProblem && !appState.frameworks && !isRecommending) {
      handleRecommend();
    }
  }, [appState.caseGlance?.coreProblem]);

  const handleRecommend = async () => {
    sounds.playClick();
    if (!appState.caseGlance) {
      toast.error("Please run Case Intake first to structure the problem.");
      return;
    }
    setIsRecommending(true);
    try {
      const result = await recommendFrameworks(
        appState.caseGlance.caseType,
        appState.caseGlance.coreProblem
      );
      setAppState(prev => ({ ...prev, frameworks: result }));
      toast.success("Strategic frameworks recommended!");
    } catch (err: any) {
      toast.error("Failed to generate frameworks: " + (err?.message || ""));
    } finally {
      setIsRecommending(false);
    }
  };

  const togglePin = (fw: Framework) => {
    setAppState(prev => {
      const active = prev.activeFrameworks || [];
      const isCurrentlyPinned = active.some(a => a.name === fw.name);
      
      if (isCurrentlyPinned) {
        sounds.playRemove();
        return { ...prev, activeFrameworks: active.filter(a => a.name !== fw.name) };
      }
      
      sounds.playAdd();
      if (active.length >= 2) {
        // Either ignore or replace the oldest. Let's replace the oldest.
        return { ...prev, activeFrameworks: [...active.slice(1), fw] };
      }
      return { ...prev, activeFrameworks: [...active, fw] };
    });
  };

  const isPinned = (fwName: string) => {
    return (appState.activeFrameworks || []).some(a => a.name === fwName);
  };

  const loadingMessages = [
    "Analyzing industry context...",
    "Matching strategic models...",
    "Adapting frameworks to case...",
    "Generating structured approaches..."
  ];

  return (
    <section className="bg-[#0f172a] flex flex-col flex-1 min-h-0 border border-slate-800 animate-in fade-in slide-in-from-bottom-4 duration-500 rounded-lg overflow-hidden">
      <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-[#070b14]/50">
        <div className="flex items-center gap-4">
          <h2 className="text-xs font-bold uppercase tracking-widest text-slate-500">Framework Selection</h2>
          <ShimmerButton
            onClick={handleRecommend}
            disabled={isRecommending || !appState.caseGlance}
            isLoading={isRecommending}
            className="bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 text-[10px] uppercase font-bold text-white px-3 py-1.5 rounded transition-colors"
          >
            {isRecommending ? 'Generating...' : 'Recommend Frameworks'}
          </ShimmerButton>
        </div>
        <div className="flex items-center gap-2">
          {isRecommending ? (
            <>
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
              <span className="text-[10px] text-blue-400 font-medium uppercase min-w-[120px]">
                <CyclingLoadingText messages={loadingMessages} />
              </span>
            </>
          ) : (
            <>
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-[10px] text-slate-400 font-medium uppercase">Model Ready</span>
            </>
          )}
        </div>
      </div>

      <div className="p-6 space-y-6 flex-1 overflow-y-auto custom-scrollbar">
        {appState.activeFrameworks && appState.activeFrameworks.length > 0 && (
          <div className="space-y-3 mb-6 relative">
            <p className="text-[10px] uppercase text-amber-500 font-bold tracking-widest flex items-center gap-1.5">
              <Check className="w-3 h-3" /> Active Frameworks ({appState.activeFrameworks.length}/2)
            </p>
            <div className="flex flex-wrap gap-3">
               {appState.activeFrameworks.map((fw, idx) => (
                  <div key={idx} className="bg-amber-500/10 border border-amber-500/30 rounded-full pl-3 pr-2 py-1 flex items-center gap-2">
                     <span className="text-xs font-bold text-amber-400">{fw.name}</span>
                     <button onClick={() => togglePin(fw)} className="text-amber-500/60 hover:text-amber-400 transition-colors">
                       <Check className="w-3.5 h-3.5" />
                     </button>
                  </div>
               ))}
            </div>
            <div className="absolute -bottom-4 left-0 right-0 h-px bg-gradient-to-r from-slate-800 via-slate-700 to-slate-800" />
          </div>
        )}

        {appState.frameworks ? (
          <div className="space-y-4 pt-2">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2 mb-2">
              <p className="text-[10px] md:text-[11px] uppercase text-slate-500 font-bold tracking-widest">
                Top Framework Recommendations
              </p>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#00d4ff]/5 border border-[#00d4ff]/20 text-[#00d4ff]/70 text-[9px] font-bold uppercase tracking-widest animate-[pulse_3s_ease-in-out_infinite]">
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" /></svg>
                Hover cards to expand & select
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
              {appState.frameworks.map((fw, idx) => {
                const pinned = isPinned(fw.name);
                const borderColor = BORDER_COLORS[idx % BORDER_COLORS.length];
                
                return (
                  <div 
                    key={idx} 
                    className={`group relative flex flex-col border-y border-r border-l-4 rounded-r-xl transition-all duration-300 overflow-hidden bg-slate-900/30 hover:bg-slate-900/50 ${
                      pinned ? 'border-r-amber-400 border-y-amber-400 border-l-amber-400 shadow-[0_0_15px_rgba(251,191,36,0.15)] bg-amber-900/10' : `border-r-slate-800 border-y-slate-800 hover:border-r-slate-700 hover:border-y-slate-700 ${borderColor}`
                    }`}
                  >
                    {pinned && (
                      <div className="absolute top-0 right-0 bg-amber-400 text-amber-950 w-6 h-6 flex items-center justify-center rounded-bl-lg z-10 shadow-sm transition-transform">
                        <Check className="w-3.5 h-3.5 font-bold" />
                      </div>
                    )}
                    
                    <div className="p-5 flex flex-col gap-2 relative z-0">
                      <div className="pr-4">
                        <h3 className={`text-lg leading-tight font-bold ${pinned ? 'text-amber-400' : 'text-slate-200 group-hover:text-white transition-colors'}`}>
                          <TypewriterText text={fw.name} />
                        </h3>
                      </div>
                      <div className="mt-1">
                        <p className="text-[11px] leading-relaxed text-slate-400">
                          <TypewriterText text={fw.whyItFits} />
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-rows-[0fr] group-hover:grid-rows-[1fr] transition-[grid-template-rows] duration-200">
                      <div className="overflow-hidden">
                        <div className="px-5 pb-5 pt-2 border-t border-slate-800/50 bg-slate-950/20">
                          <p className="text-[9px] uppercase text-slate-500 font-bold tracking-wider mb-3">Diagnostic Questions</p>
                          <ul className="space-y-3">
                            {fw.diagnosticQuestions.map((q, qIdx) => (
                              <li key={qIdx} className="flex gap-2 items-start opacity-90">
                                <span className="text-[10px] font-mono text-blue-500 font-bold mt-0.5">{qIdx + 1}.</span>
                                <div className="flex-1">
                                  <p className="text-[11px] text-slate-300 leading-relaxed">
                                    <TypewriterText text={q} />
                                  </p>
                                </div>
                              </li>
                            ))}
                          </ul>
                          
                          <button 
                            onClick={() => togglePin(fw)}
                            className={`w-full mt-5 py-2 px-3 rounded text-xs font-bold uppercase tracking-widest transition-colors flex items-center justify-center gap-2 ${
                              pinned 
                                ? 'bg-amber-500/20 text-amber-500 hover:bg-amber-500/30' 
                                : 'bg-slate-800 text-slate-300 hover:bg-blue-600 hover:text-white'
                            }`}
                          >
                            <Pin className="w-3.5 h-3.5" />
                            {pinned ? 'Unpin Framework' : 'Use This Framework'}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : appState.issueTree ? (
          <div className="h-48 border border-dashed border-slate-800 rounded bg-slate-900/20 flex flex-col items-center justify-center text-slate-600 gap-4">
            <span className="text-xs uppercase font-bold tracking-widest">
              Ready to recommend frameworks
            </span>
            <ShimmerButton
              onClick={handleRecommend}
              disabled={isRecommending}
              isLoading={isRecommending}
              className="bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 text-sm uppercase font-bold text-white px-6 py-3 rounded-lg transition-colors"
            >
              {isRecommending ? 'Generating...' : 'Recommend Frameworks'}
            </ShimmerButton>
          </div>
        ) : (
          <EmptyState 
            title="Awaiting Logic Tree"
            description="You need to build the issue tree first before selecting frameworks."
            actionLabel="Go to Structure"
            onAction={onGoBack}
          />
        )}

        {appState.activeFrameworks?.length > 0 && onNext && (
          <div className="flex justify-end pt-4 border-t border-slate-800 mt-6">
            <button 
              onClick={() => {
                sounds.playTransition();
                if (onNext) onNext();
              }}
              className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded text-xs font-bold uppercase tracking-widest transition-colors flex items-center gap-2"
            >
              Draft Recommendation
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            </button>
          </div>
        )}
      </div>
    </section>
  );
};
