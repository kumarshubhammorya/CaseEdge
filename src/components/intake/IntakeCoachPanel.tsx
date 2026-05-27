import React from 'react';
import { Brain, RefreshCw, CheckCircle2, AlertCircle, HelpCircle } from 'lucide-react';
import { motion } from 'motion/react';
import { ShimmerButton, CyclingLoadingText } from '../MicroInteractions';
import { UserClue, IntakeFeedback } from '../../types';

type IntakeCoachPanelProps = {
  isAuditing: boolean;
  isAnalyzing: boolean;
  isUploading: boolean;
  userClues: UserClue[];
  intakeFeedback: IntakeFeedback | null;
  caseGlance: any;
  tokens: number;
  onAudit: () => void;
  onAnalyze: () => void;
};

export const IntakeCoachPanel: React.FC<IntakeCoachPanelProps> = ({
  isAuditing,
  isAnalyzing,
  isUploading,
  userClues,
  intakeFeedback,
  caseGlance,
  tokens,
  onAudit,
  onAnalyze,
}) => {
  return (
    <div className="w-full lg:w-80 shrink-0">
      <div className="flex flex-col bg-slate-900/60 border border-slate-800 rounded-xl p-5 h-full relative overflow-hidden">
        <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-800 shrink-0">
          <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
            <Brain className="w-4 h-4 text-cyan-400" />
            Intake Coach
          </h3>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar space-y-4 mb-4 pr-1">
          {isAuditing ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-500 gap-3 py-12">
              <RefreshCw className="w-8 h-8 text-cyan-500 animate-spin" />
              <span className="text-[10px] uppercase font-mono text-cyan-400 font-medium">
                <CyclingLoadingText messages={[
                  "Analyzing highlights...",
                  "Cross-referencing constraints...",
                  "Evaluating metrics...",
                  "Formulating guidance..."
                ]} />
              </span>
            </div>
          ) : intakeFeedback ? (
            <div className="space-y-4 animate-in fade-in duration-300">
              {/* Score gauge */}
              <div className="flex items-center gap-4 bg-slate-950/40 p-4 rounded-lg border border-slate-800">
                <div className="relative w-14 h-14 shrink-0 flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle cx="28" cy="28" r="24" className="stroke-slate-800 fill-none" strokeWidth="3" />
                    <circle
                      cx="28"
                      cy="28"
                      r="24"
                      className={`fill-none transition-all duration-1000 ${
                        intakeFeedback.score >= 80 ? 'stroke-green-500' :
                        intakeFeedback.score >= 50 ? 'stroke-amber-500' : 'stroke-red-500'
                      }`}
                      strokeWidth="3"
                      strokeDasharray={2 * Math.PI * 24}
                      strokeDashoffset={2 * Math.PI * 24 * (1 - intakeFeedback.score / 100)}
                      strokeLinecap="round"
                    />
                  </svg>
                  <span className="absolute text-xs font-bold font-mono text-white">
                    {intakeFeedback.score}
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <span className="text-[10px] uppercase font-mono text-slate-500 font-bold block">Comprehension</span>
                  <p className="text-xs text-slate-400 mt-0.5 leading-normal">
                    {intakeFeedback.summary}
                  </p>
                </div>
              </div>

              {/* Correct Clues */}
              {intakeFeedback.correctClues.length > 0 && (
                <div className="space-y-1.5">
                  <span className="text-[10px] uppercase font-bold text-green-400 tracking-wider flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                    Key Clues Found
                  </span>
                  <ul className="text-xs space-y-1 pl-4 list-disc text-slate-300">
                    {intakeFeedback.correctClues.map((item, i) => (
                      <li key={i} className="leading-relaxed">{item}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Missing Clues */}
              {intakeFeedback.missingClues.length > 0 && (
                <div className="space-y-1.5">
                  <span className="text-[10px] uppercase font-bold text-amber-500 tracking-wider flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    Missing details
                  </span>
                  <ul className="text-xs space-y-1 pl-4 list-disc text-slate-300">
                    {intakeFeedback.missingClues.map((item, i) => (
                      <li key={i} className="leading-relaxed">{item}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-slate-650 text-center py-12 px-4 gap-2">
              <HelpCircle className="w-8 h-8 opacity-30 text-slate-500" />
              <p className="text-xs uppercase tracking-wider font-extrabold text-slate-400">Run Highlight Audit</p>
              <p className="text-xs text-slate-500 max-w-[200px] leading-normal">
                Highlight objective, constraint, stakeholder, and metric details inside the brief, then click audit below.
              </p>
            </div>
          )}
        </div>

        <div className="space-y-2 shrink-0">
          <ShimmerButton
            onClick={onAudit}
            disabled={isAuditing || isAnalyzing || !(userClues && userClues.length > 0) || !!intakeFeedback}
            isLoading={isAuditing}
            className="w-full py-2 bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-800 disabled:text-slate-500 disabled:border-slate-850 text-white rounded-md text-xs font-bold uppercase tracking-wider border border-cyan-500/30 transition-colors shadow-[0_0_15px_rgba(8,145,178,0.15)] cursor-pointer"
          >
            {isAuditing ? 'Auditing Highlights...' : 'Audit Highlights'}
          </ShimmerButton>

          <motion.button
            onClick={onAnalyze}
            disabled={isAnalyzing || isUploading || isAuditing || (!caseGlance && !intakeFeedback && (tokens ?? 0) < 10)}
            whileHover={isAnalyzing || isUploading || isAuditing || (!caseGlance && !intakeFeedback && (tokens ?? 0) < 10) ? {} : { scale: 1.015 }}
            whileTap={isAnalyzing || isUploading || isAuditing || (!caseGlance && !intakeFeedback && (tokens ?? 0) < 10) ? {} : { scale: 0.985 }}
            className={`w-full py-2 rounded-md text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer border focus-visible:ring-2 focus-visible:ring-cyan-500/50 focus-visible:outline-none focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 ${
              !!intakeFeedback && !caseGlance
                ? "bg-cyan-600 hover:bg-cyan-500 border-cyan-500/30 text-white shadow-[0_0_15px_rgba(8,145,178,0.15)]"
                : "bg-slate-800 hover:bg-slate-700 disabled:bg-slate-900 border-slate-700 disabled:border-slate-800 text-slate-300 disabled:text-slate-650 hover:text-white"
            }`}
          >
            {isAnalyzing 
              ? 'Extracting...' 
              : caseGlance 
              ? 'Re-run AI Extraction' 
              : intakeFeedback 
              ? 'Generate Case at a Glance (Free)' 
              : 'Bypass & Auto-Analyze (Costs 10 ⚡)'}
          </motion.button>
        </div>
      </div>
    </div>
  );
};
