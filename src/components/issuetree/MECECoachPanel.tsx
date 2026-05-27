import React from 'react';
import { Brain, RefreshCw, AlertCircle, Info } from 'lucide-react';
import { ShimmerButton, CyclingLoadingText } from '../MicroInteractions';
import { MECEFeedback } from '../../types';

type MECECoachPanelProps = {
  isAuditing: boolean;
  meceFeedback: MECEFeedback | null;
  hasAiTree: boolean;
  onInitializeFromAI: () => void;
  onResetPlayground: () => void;
  onAudit: () => void;
};

export const MECECoachPanel: React.FC<MECECoachPanelProps> = ({
  isAuditing,
  meceFeedback,
  hasAiTree,
  onInitializeFromAI,
  onResetPlayground,
  onAudit,
}) => {
  return (
    <div className="w-full lg:w-80 shrink-0">
      <div className="flex flex-col bg-slate-900/60 border border-slate-800 rounded-xl p-5 h-full relative overflow-hidden">
        <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-800 shrink-0">
          <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
            <Brain className="w-4 h-4 text-cyan-400" />
            MECE Coach
          </h3>
          <div className="flex items-center gap-2">
            {hasAiTree && (
              <button
                onClick={onInitializeFromAI}
                className="text-[10px] uppercase font-extrabold text-blue-400 hover:text-blue-300 transition-colors cursor-pointer"
                title="Initialize custom tree using the AI generated model"
              >
                Copy AI Tree
              </button>
            )}
            <button
              onClick={onResetPlayground}
              className="text-[10px] uppercase font-extrabold text-red-400 hover:text-red-300 transition-colors cursor-pointer"
              title="Reset interactive playground"
            >
              Reset
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar space-y-4 mb-4 pr-1">
          {isAuditing ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-500 gap-3 py-12">
              <RefreshCw className="w-8 h-8 text-cyan-500 animate-spin" />
              <span className="text-[10px] uppercase font-mono text-cyan-400 font-medium">
                <CyclingLoadingText messages={[
                  "Analyzing hierarchy...",
                  "Verifying MECE partition...",
                  "Scanning for duplicates...",
                  "Formulating feedback..."
                ]} />
              </span>
            </div>
          ) : meceFeedback ? (
            <div className="space-y-4 animate-in fade-in duration-300">
              {/* Score Ring */}
              <div className="flex items-center gap-4 bg-slate-950/40 p-4 rounded-lg border border-slate-800">
                <div className="relative w-14 h-14 shrink-0 flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle
                      cx="28"
                      cy="28"
                      r="24"
                      className="stroke-slate-800 fill-none"
                      strokeWidth="3"
                    />
                    <circle
                      cx="28"
                      cy="28"
                      r="24"
                      className={`fill-none transition-all duration-1000 ${
                        meceFeedback.score >= 80
                          ? 'stroke-green-500'
                          : meceFeedback.score >= 50
                          ? 'stroke-amber-500'
                          : 'stroke-red-500'
                      }`}
                      strokeWidth="3"
                      strokeDasharray={2 * Math.PI * 24}
                      strokeDashoffset={2 * Math.PI * 24 * (1 - meceFeedback.score / 100)}
                      strokeLinecap="round"
                    />
                  </svg>
                  <span className="absolute text-xs font-bold font-mono text-white">
                    {meceFeedback.score}
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <div className={`text-[10px] font-extrabold uppercase tracking-wider ${
                    meceFeedback.isMECE ? 'text-green-400' : 'text-amber-500'
                  }`}>
                    {meceFeedback.isMECE ? 'MECE Standard Met' : 'Logic Gaps Detected'}
                  </div>
                  <p className="text-[10px] text-slate-400 mt-0.5 leading-normal">
                    {meceFeedback.meceSummary}
                  </p>
                </div>
              </div>

              {/* Overlaps & Gaps */}
              {meceFeedback.overlaps.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-[10px] uppercase font-bold text-amber-500 tracking-wider flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    Overlaps (Redundant logic)
                  </h4>
                  <ul className="text-xs space-y-1.5 pl-4 list-disc text-slate-300">
                    {meceFeedback.overlaps.map((overlap, i) => (
                      <li key={i} className="leading-relaxed">{overlap}</li>
                    ))}
                  </ul>
                </div>
              )}

              {meceFeedback.structuralGaps.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-[10px] uppercase font-bold text-blue-400 tracking-wider flex items-center gap-1">
                    <Info className="w-3.5 h-3.5 shrink-0" />
                    Structural Gaps (Missing branches)
                  </h4>
                  <ul className="text-xs space-y-1.5 pl-4 list-disc text-slate-300">
                    {meceFeedback.structuralGaps.map((gap, i) => (
                      <li key={i} className="leading-relaxed">{gap}</li>
                    ))}
                  </ul>
                </div>
              )}

              {meceFeedback.overlaps.length === 0 && meceFeedback.structuralGaps.length === 0 && (
                <div className="py-4 text-center text-slate-500 text-xs">
                  🎉 Excellent structure! No logic overlaps or gaps detected.
                </div>
              )}
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-slate-650 text-center py-12 px-4 gap-2">
              <AlertCircle className="w-8 h-8 opacity-30 text-slate-500" />
              <p className="text-[10px] uppercase tracking-wider font-extrabold text-slate-400">Awaiting Audit</p>
              <p className="text-[10px] text-slate-500 max-w-[200px] leading-normal">
                Build your logic tree, then click the audit button below to run the AI MECE check.
              </p>
            </div>
          )}
        </div>

        <ShimmerButton
          onClick={onAudit}
          disabled={isAuditing}
          isLoading={isAuditing}
          className="w-full py-2 bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-800 text-white rounded-md text-[10px] font-bold uppercase tracking-wider border border-cyan-500/30 transition-colors shadow-[0_0_15px_rgba(8,145,178,0.15)] hover:shadow-[0_0_20px_rgba(8,145,178,0.3)] shrink-0 cursor-pointer"
        >
          {isAuditing ? 'Auditing...' : 'Run MECE Audit'}
        </ShimmerButton>
      </div>
    </div>
  );
};
