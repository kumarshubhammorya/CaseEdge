import React, { useState } from "react";
import { toast } from "sonner";
import {
  draftRecommendation,
  generateRecommendationHints
} from "../services/geminiService";
import { EmptyState } from './EmptyState';
import { Lightbulb } from "lucide-react";
import { ShimmerButton, CyclingLoadingText, Tooltip } from './MicroInteractions';
import { sounds } from '../lib/sounds';
import { useAppContext } from '../context/AppContext';

// Import sub-components
import { SCRStructureEditor } from "./SCRStructureEditor";
import { AudienceCalibrator } from "./AudienceCalibrator";
import { FinancialQuantifier } from "./FinancialQuantifier";

type Props = {
  onNext?: () => void;
  onGoToAssumptions?: () => void;
  onGoBack?: () => void;
};

export const DrafterSection: React.FC<Props> = ({ onNext, onGoToAssumptions, onGoBack }) => {
  const { appState, setAppState } = useAppContext();
  const [isDrafting, setIsDrafting] = useState(false);
  const [isGeneratingHints, setIsGeneratingHints] = useState(false);
  const [hints, setHints] = useState<{ approach: string, recommendation: string }[] | null>(null);

  const handleGenerateHints = async () => {
    sounds.playClick();
    setIsGeneratingHints(true);
    try {
      const result = await generateRecommendationHints(appState.caseBrief, appState.caseGlance?.coreProblem);
      setHints(result);
      toast.success("AI hints generated!");
    } catch (err: any) {
      toast.error("Failed to generate hints: " + (err?.message || ""));
    } finally {
      setIsGeneratingHints(false);
    }
  };

  const handleDraft = async () => {
    sounds.playClick();
    if (!appState.coreRecommendation.trim()) {
      toast.error("Please provide a core recommendation first.");
      return;
    }
    setIsDrafting(true);
    try {
      const result = await draftRecommendation(appState.coreRecommendation);
      setAppState((prev) => ({ ...prev, expandedRecommendation: result }));
      toast.success("Recommendation structured as SCR!");
    } catch (err: any) {
      toast.error("Failed to draft structure: " + (err?.message || ""));
    } finally {
      setIsDrafting(false);
    }
  };

  return (
    <section className="bg-[#0f172a] flex flex-col flex-1 min-h-0 border border-slate-800 animate-in fade-in slide-in-from-bottom-4 duration-500 rounded-lg overflow-hidden">
      <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-[#070b14]/50">
        <div className="flex items-center gap-4">
          <h2 className="text-xs font-bold uppercase tracking-widest text-slate-500">
            Working Draft
          </h2>
        </div>
        <div className="flex items-center gap-2">
          {isDrafting ? (
            <>
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
              <span className="text-[10px] text-blue-400 font-medium uppercase min-w-[120px]">
                <CyclingLoadingText messages={["Drafting situation...", "Identifying core complication...", "Structuring resolution...", "Polishing SCR flow..."]} />
              </span>
            </>
          ) : (
            <>
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-[10px] text-slate-400 font-medium uppercase">
                Model Ready
              </span>
            </>
          )}
        </div>
      </div>

      <div className="p-6 space-y-6 flex-1 overflow-y-auto custom-scrollbar">
        {!appState.frameworks ? (
          <EmptyState 
            title="Awaiting Frameworks"
            description="You need to select analysis frameworks first before drafting a recommendation."
            actionLabel="Go to Frameworks"
            onAction={onGoBack}
          />
        ) : (
          <>
            {!appState.expandedRecommendation && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-slate-400">Need some ideas?</span>
                  <Tooltip content="Generate AI-powered recommendation hints based on the case brief" position="left">
                    <ShimmerButton
                      onClick={handleGenerateHints}
                      disabled={isGeneratingHints || !appState.caseBrief}
                      isLoading={isGeneratingHints}
                      className="bg-amber-500/10 hover:bg-amber-500/20 disabled:bg-slate-800 text-amber-500 border border-amber-500/30 text-[10px] uppercase font-bold px-3 py-1.5 rounded transition-colors flex items-center gap-1.5"
                    >
                      <Lightbulb className="w-3 h-3" />
                      {isGeneratingHints ? "Generating..." : "Get AI Hints"}
                    </ShimmerButton>
                  </Tooltip>
                </div>
                
                {hints && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4 animate-in fade-in">
                    {hints.map((hint, idx) => (
                      <div key={idx} className="p-3 border border-slate-700 bg-slate-800/50 rounded-lg flex flex-col gap-2 relative group hover:border-amber-500/50 transition-colors">
                        <p className="text-[10px] uppercase font-bold text-amber-500">{hint.approach}</p>
                        <p className="text-xs text-slate-300 flex-1">{hint.recommendation}</p>
                        <button 
                          onClick={() => {
                            sounds.playClick();
                            setAppState(prev => ({ ...prev, coreRecommendation: hint.recommendation }));
                          }}
                          className="mt-2 w-full py-1.5 bg-slate-700 hover:bg-amber-600 text-[10px] uppercase font-bold text-white rounded transition-colors opacity-0 group-hover:opacity-100"
                        >
                          Use this idea
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
            
            <div className="relative">
              <textarea
                className="w-full h-24 bg-slate-900 border border-slate-700 rounded-md p-3 text-sm text-slate-300 focus:outline-none focus:border-blue-500 resize-none font-sans"
                placeholder="Type your team's core recommendation in 1-2 sentences..."
                value={appState.coreRecommendation}
                onChange={(e) =>
                  setAppState((prev) => ({
                    ...prev,
                    coreRecommendation: e.target.value,
                  }))
                }
              />
              <ShimmerButton
                onClick={handleDraft}
                disabled={isDrafting}
                isLoading={isDrafting}
                className="absolute bottom-3 right-3 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 text-[10px] uppercase font-bold text-white px-3 py-1.5 rounded transition-colors"
              >
                {isDrafting ? "Structuring..." : "Format as SCR"}
              </ShimmerButton>
            </div>

            {/* Structured SCR editor */}
            <SCRStructureEditor />

            {/* Audience Calibrator */}
            <AudienceCalibrator />

            {/* Financial Quantification Section */}
            <FinancialQuantifier />

            {appState.expandedRecommendation && (onNext || onGoToAssumptions) && (
              <div className="flex justify-end items-center gap-3 pt-4 border-t border-slate-800 mt-6 pb-4">
                {onGoToAssumptions && (
                  <button 
                    onClick={() => {
                      sounds.playTransition();
                      onGoToAssumptions();
                    }}
                    className="bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 px-4 py-2 rounded text-xs font-bold uppercase tracking-widest transition-colors flex items-center gap-2"
                  >
                    Track Assumptions
                  </button>
                )}
                {onNext && (
                  <button 
                    onClick={() => {
                      sounds.playTransition();
                      onNext();
                    }}
                    className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded text-xs font-bold uppercase tracking-widest transition-colors flex items-center gap-2"
                  >
                    Generate Slide Outline
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                  </button>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
};
