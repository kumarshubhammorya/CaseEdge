import React from 'react';
import { Zap, Lightbulb } from 'lucide-react';
import { EditableField, EditableListField, ShimmerButton } from '../MicroInteractions';
import { CaseGlance } from '../../types';

type CaseGlanceViewProps = {
  caseGlance: CaseGlance;
  hypothesis: string;
  aiSuggestion: { hypothesis: string; reasoning: string } | null;
  isGeneratingHypothesis: boolean;
  onUpdateGlance: (field: keyof CaseGlance, value: any) => void;
  onHypothesisChange: (val: string) => void;
  onGenerateHypothesis: () => void;
  onAdoptHypothesis: () => void;
  caseBrief: string;
  tokens: number;
};

export const CaseGlanceView: React.FC<CaseGlanceViewProps> = ({
  caseGlance,
  hypothesis,
  aiSuggestion,
  isGeneratingHypothesis,
  onUpdateGlance,
  onHypothesisChange,
  onGenerateHypothesis,
  onAdoptHypothesis,
  caseBrief,
  tokens,
}) => {
  return (
    <div className="space-y-4 animate-in fade-in pt-4 border-t border-slate-800">
      <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
        <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
        Case at a Glance
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-3 border border-slate-800 rounded bg-slate-900/30">
          <p className="text-[10px] uppercase text-slate-500 font-bold mb-1">Industry</p>
          <EditableField
            value={caseGlance.industry}
            onChange={(val) => onUpdateGlance('industry', val)}
            textClassName="text-xs font-semibold text-slate-200 w-full"
          />
        </div>
        <div className="p-3 border border-slate-800 rounded bg-slate-900/30">
          <p className="text-[10px] uppercase text-slate-500 font-bold mb-1">Case Type</p>
          <EditableField
            value={caseGlance.caseType}
            onChange={(val) => onUpdateGlance('caseType', val)}
            textClassName="text-xs font-semibold text-slate-200 w-full"
          />
        </div>
        <div className="p-3 border border-slate-800 rounded bg-slate-900/30 col-span-1 md:col-span-2">
          <p className="text-[10px] uppercase text-slate-500 font-bold mb-1">Core Problem</p>
          <EditableField
            value={caseGlance.coreProblem}
            onChange={(val) => onUpdateGlance('coreProblem', val)}
            multiline
            textClassName="text-xs text-slate-200 w-full pt-1"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <p className="text-[10px] uppercase text-slate-500 font-bold">Key Stakeholders</p>
          <EditableListField
            items={caseGlance.keyStakeholders}
            onChange={(val) => onUpdateGlance('keyStakeholders', val)}
            className="bg-slate-900/30 border border-slate-800 rounded"
            textClassName="text-xs text-slate-300"
          />
        </div>
        <div className="space-y-1.5">
          <p className="text-[10px] uppercase text-slate-500 font-bold">Key Constraints</p>
          <EditableListField
            items={caseGlance.keyConstraints}
            onChange={(val) => onUpdateGlance('keyConstraints', val)}
            className="bg-slate-900/30 border border-slate-800 rounded"
            textClassName="text-xs text-slate-300"
          />
        </div>
      </div>

      {caseGlance.clarifyingQuestions && caseGlance.clarifyingQuestions.length > 0 && (
        <div className="space-y-2 mt-4">
          <p className="text-[10px] uppercase text-purple-400 font-bold flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Clarifying Questions to Ask the Interviewer
          </p>
          <EditableListField
            items={caseGlance.clarifyingQuestions}
            onChange={(val) => onUpdateGlance('clarifyingQuestions', val)}
            className="bg-purple-950/10 border border-purple-900/20 rounded"
            textClassName="text-xs text-slate-300"
          />
        </div>
      )}

      {/* Hypothesis Section (Optional) */}
      <div className="mt-6 pt-5 border-t border-slate-850 space-y-4">
        <div className="flex justify-between items-center mt-2">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-widest text-purple-400 flex items-center gap-2">
              <Zap className="w-3.5 h-3.5 text-cyan-400 fill-cyan-400/20 shrink-0" />
              Day-One Hypothesis <span className="text-[10px] text-slate-500 font-normal uppercase tracking-widest">(Optional)</span>
            </h3>
            <p className="text-xs text-slate-400 mt-1">Formulate a testable starting hypothesis to guide the tree.</p>
          </div>
          <ShimmerButton
            onClick={onGenerateHypothesis}
            disabled={isGeneratingHypothesis || !caseBrief || (tokens ?? 0) < 5}
            isLoading={isGeneratingHypothesis}
            className="bg-purple-500/10 hover:bg-purple-500/20 disabled:bg-slate-800 text-purple-400 border border-purple-500/30 text-[10px] uppercase font-bold px-3 py-1.5 rounded transition-colors flex items-center gap-1.5 shrink-0 ml-4 cursor-pointer"
          >
            <Lightbulb className="w-3 h-3" />
            {isGeneratingHypothesis ? "Analyzing..." : "AI Suggestion (5 ⚡)"}
          </ShimmerButton>
        </div>

        <textarea
          className="w-full h-24 bg-slate-900 border border-slate-700 rounded-md p-3 text-sm text-slate-350 focus:outline-none focus:border-purple-500/50 resize-none font-sans"
          placeholder="e.g. The decline in profitability is driven by a recent drop in passenger volume..."
          value={hypothesis}
          onChange={(e) => onHypothesisChange(e.target.value)}
        />

        {aiSuggestion && (
          <div className="p-4 border border-purple-500/30 bg-purple-900/10 rounded-lg space-y-3 animate-in fade-in">
            <div>
              <span className="text-[10px] text-purple-400 font-bold uppercase tracking-widest mb-1 block">Suggested Hypothesis</span>
              <p className="text-xs text-slate-200">{aiSuggestion.hypothesis}</p>
            </div>
            <div className="pt-2 border-t border-purple-500/20">
              <span className="text-[10px] text-purple-400/70 font-bold uppercase tracking-widest mb-1 block">Reasoning</span>
              <p className="text-xs text-slate-400 italic leading-relaxed">{aiSuggestion.reasoning}</p>
            </div>
            <button 
              onClick={onAdoptHypothesis}
              className="mt-3 w-full text-xs bg-purple-500/25 hover:bg-purple-500/40 text-purple-300 px-3 py-2 rounded transition-colors font-bold uppercase tracking-widest cursor-pointer"
            >
              Adopt this hypothesis
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
