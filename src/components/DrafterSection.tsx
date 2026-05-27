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
  const [isFreeform, setIsFreeform] = useState(false);

  const handleGenerateHints = async () => {
    if ((appState.tokens ?? 0) < 5) {
      sounds.playError();
      toast.error("Insufficient tokens! You need at least 5 tokens to get AI hints.");
      return;
    }
    sounds.playClick();
    setIsGeneratingHints(true);
    try {
      const result = await generateRecommendationHints(appState.caseBrief, appState.caseGlance?.coreProblem);
      setHints(result);
      setAppState(prev => ({ ...prev, tokens: Math.max(0, (prev.tokens ?? 50) - 5) }));
      toast.success("AI hints generated! (-5 ⚡)");
    } catch (err: any) {
      toast.error("Failed to generate hints: " + (err?.message || ""));
    } finally {
      setIsGeneratingHints(false);
    }
  };

  const handleDraft = async () => {
    sounds.playClick();
    
    let recommendationToUse = "";
    if (!isFreeform) {
      if (!(appState.recLead || "").trim()) {
        toast.error("Please fill in the Action Recommendation field.");
        return;
      }
      recommendationToUse = `Core Action: ${(appState.recLead || "").trim()}`;
      if ((appState.recPillar1 || "").trim()) {
        recommendationToUse += `\nFinancial Support: ${(appState.recPillar1 || "").trim()}`;
      }
      if ((appState.recPillar2 || "").trim()) {
        recommendationToUse += `\nOperational Support: ${(appState.recPillar2 || "").trim()}`;
      }
      if ((appState.recRisk || "").trim()) {
        recommendationToUse += `\nKey Risk & Mitigation: ${(appState.recRisk || "").trim()}`;
      }
      
      // Update coreRecommendation in state
      setAppState(prev => ({ ...prev, coreRecommendation: recommendationToUse }));
    } else {
      if (!appState.coreRecommendation.trim()) {
        toast.error("Please provide a core recommendation first.");
        return;
      }
      recommendationToUse = appState.coreRecommendation;
    }

    setIsDrafting(true);
    try {
      const result = await draftRecommendation(recommendationToUse);
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
                  <Tooltip content={appState.caseBrief ? "Deduct 5 tokens to get recommendation hints" : "Upload case brief first"} position="left">
                    <ShimmerButton
                      onClick={handleGenerateHints}
                      disabled={isGeneratingHints || !appState.caseBrief || (appState.tokens ?? 0) < 5}
                      isLoading={isGeneratingHints}
                      className="bg-amber-500/10 hover:bg-amber-500/20 disabled:bg-slate-800 text-amber-500 border border-amber-500/30 text-[10px] uppercase font-bold px-3 py-1.5 rounded transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <Lightbulb className="w-3 h-3" />
                      {isGeneratingHints ? "Generating..." : "Get AI Hints (5 ⚡)"}
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
                            setIsFreeform(true);
                          }}
                          className="mt-2 w-full py-1.5 bg-slate-705 hover:bg-amber-600 text-[10px] uppercase font-bold text-white rounded transition-colors opacity-0 group-hover:opacity-100 cursor-pointer"
                        >
                          Use this idea
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
            
            {/* Scaffolding Editor Switcher */}
            {!isFreeform ? (
              <div className="space-y-4 bg-slate-900/30 p-5 border border-slate-800 rounded-lg">
                <div className="text-xs text-blue-400 font-semibold uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse"></span>
                  Structured Pyramid Scaffolding (Recommended)
                </div>
                
                <div className="space-y-4">
                  <div>
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 mb-1">
                      <label className="block text-[10px] font-bold uppercase text-slate-500">
                        Action Recommendation (Lead)
                      </label>
                      <div className="flex gap-1.5 flex-wrap">
                        <button 
                          onClick={() => {
                            sounds.playClick();
                            setAppState(prev => ({ ...prev, recLead: "Acquire [Target] for $[Amount] to capture [Percent]% market share." }));
                          }}
                          className="px-1.5 py-0.5 rounded bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-slate-200 text-[10px] font-bold transition-colors cursor-pointer border border-slate-700/50"
                        >
                          Acquisition Outline
                        </button>
                        <button 
                          onClick={() => {
                            sounds.playClick();
                            setAppState(prev => ({ ...prev, recLead: "Enter the [Region] market via a [D2C/Wholesale] channel model." }));
                          }}
                          className="px-1.5 py-0.5 rounded bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-slate-200 text-[10px] font-bold transition-colors cursor-pointer border border-slate-700/50"
                        >
                          Market Entry Outline
                        </button>
                      </div>
                    </div>
                    <input
                      type="text"
                      className="w-full bg-slate-900 border border-slate-700 rounded p-2.5 text-xs text-slate-300 focus:outline-none focus:border-blue-500 font-sans"
                      placeholder="e.g., M&A target acquisition of Airline X to capture regional market share..."
                      value={appState.recLead || ""}
                      onChange={(e) =>
                        setAppState((prev) => ({
                          ...prev,
                          recLead: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 mb-1">
                        <label className="block text-[10px] font-bold uppercase text-slate-500">
                          Pillar 1: Financial Backing
                        </label>
                        <div className="flex gap-1.5">
                          <button 
                            onClick={() => {
                              sounds.playClick();
                              setAppState(prev => ({ ...prev, recPillar1: "Synergies will yield $[Amount] run-rate savings by Year [Number]." }));
                            }}
                            className="px-1.5 py-0.5 rounded bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-slate-200 text-[10px] font-bold transition-colors cursor-pointer border border-slate-700/50"
                          >
                            Synergies
                          </button>
                          <button 
                            onClick={() => {
                              sounds.playClick();
                              setAppState(prev => ({ ...prev, recPillar1: "Estimated TAM of $[Amount] supports a payback period of [Number] years." }));
                            }}
                            className="px-1.5 py-0.5 rounded bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-slate-200 text-[10px] font-bold transition-colors cursor-pointer border border-slate-700/50"
                          >
                            TAM/Payback
                          </button>
                        </div>
                      </div>
                      <input
                        type="text"
                        className="w-full bg-slate-900 border border-slate-700 rounded p-2.5 text-xs text-slate-300 focus:outline-none focus:border-blue-500 font-sans"
                        placeholder="e.g., Synergies will increase operating margin by 4.5% in Year 1..."
                        value={appState.recPillar1 || ""}
                        onChange={(e) =>
                          setAppState((prev) => ({
                            ...prev,
                            recPillar1: e.target.value,
                          }))
                        }
                      />
                    </div>
                    <div>
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 mb-1">
                        <label className="block text-[10px] font-bold uppercase text-slate-500">
                          Pillar 2: Operational Backing
                        </label>
                        <div className="flex gap-1.5">
                          <button 
                            onClick={() => {
                              sounds.playClick();
                              setAppState(prev => ({ ...prev, recPillar2: "Reallocate [Percent]% of underutilized capacity to the new service." }));
                            }}
                            className="px-1.5 py-0.5 rounded bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-slate-200 text-[10px] font-bold transition-colors cursor-pointer border border-slate-700/50"
                          >
                            Capacity
                          </button>
                          <button 
                            onClick={() => {
                              sounds.playClick();
                              setAppState(prev => ({ ...prev, recPillar2: "Consolidate [Number] redundant hubs to optimize supply chain delivery." }));
                            }}
                            className="px-1.5 py-0.5 rounded bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-slate-200 text-[10px] font-bold transition-colors cursor-pointer border border-slate-700/50"
                          >
                            Logistics
                          </button>
                        </div>
                      </div>
                      <input
                        type="text"
                        className="w-full bg-slate-900 border border-slate-700 rounded p-2.5 text-xs text-slate-300 focus:outline-none focus:border-blue-500 font-sans"
                        placeholder="e.g., Re-allocates 85% of existing crew capacity to new routes..."
                        value={appState.recPillar2 || ""}
                        onChange={(e) =>
                          setAppState((prev) => ({
                            ...prev,
                            recPillar2: e.target.value,
                          }))
                        }
                      />
                    </div>
                  </div>
                  <div>
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 mb-1">
                      <label className="block text-[10px] font-bold uppercase text-slate-500">
                        Key Risk & Mitigation
                      </label>
                      <div className="flex gap-1.5">
                        <button 
                          onClick={() => {
                            sounds.playClick();
                            setAppState(prev => ({ ...prev, recRisk: "Risk: [Competition]. Mitigation: [Loyalty campaigns and long-term pricing contracts]." }));
                          }}
                          className="px-1.5 py-0.5 rounded bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-slate-200 text-[10px] font-bold transition-colors cursor-pointer border border-slate-700/50"
                        >
                          Competition Risk
                        </button>
                        <button 
                          onClick={() => {
                            sounds.playClick();
                            setAppState(prev => ({ ...prev, recRisk: "Risk: [Integration delay]. Mitigation: [Phased rollouts and dedicated transition team]." }));
                          }}
                          className="px-1.5 py-0.5 rounded bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-slate-200 text-[10px] font-bold transition-colors cursor-pointer border border-slate-700/50"
                        >
                          Execution Risk
                        </button>
                      </div>
                    </div>
                    <input
                      type="text"
                      className="w-full bg-slate-900 border border-slate-700 rounded p-2.5 text-xs text-slate-300 focus:outline-none focus:border-blue-500 font-sans"
                      placeholder="e.g., Union friction mitigated by early partnership alignment and routing guarantees..."
                      value={appState.recRisk || ""}
                      onChange={(e) =>
                        setAppState((prev) => ({
                          ...prev,
                          recRisk: e.target.value,
                        }))
                      }
                    />
                  </div>
                </div>

                <div className="flex justify-between items-center pt-3 border-t border-slate-800/50 mt-4">
                  <button
                    onClick={() => {
                      sounds.playClick();
                      setIsFreeform(true);
                    }}
                    className="text-[10px] uppercase font-bold text-slate-500 hover:text-slate-400 transition-colors cursor-pointer"
                  >
                    Switch to Freeform Mode
                  </button>
                  <ShimmerButton
                    onClick={handleDraft}
                    disabled={isDrafting || !appState.recLead.trim()}
                    isLoading={isDrafting}
                    className="bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 text-[10px] uppercase font-bold text-white px-4 py-2 rounded transition-colors cursor-pointer"
                  >
                    {isDrafting ? "Structuring..." : "Combine & Format as SCR"}
                  </ShimmerButton>
                </div>
              </div>
            ) : (
              <div className="space-y-4 bg-slate-900/30 p-5 border border-slate-800 rounded-lg">
                <div className="text-xs text-amber-500 font-semibold uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                  Freeform Editor Mode
                </div>
                <div className="relative">
                  <textarea
                    className="w-full h-32 bg-slate-900 border border-slate-700 rounded-md p-3 text-sm text-slate-300 focus:outline-none focus:border-blue-500 resize-none font-sans"
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
                    className="absolute bottom-3 right-3 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 text-[10px] uppercase font-bold text-white px-3 py-1.5 rounded transition-colors cursor-pointer"
                  >
                    {isDrafting ? "Structuring..." : "Format as SCR"}
                  </ShimmerButton>
                </div>
                <div className="flex justify-start pt-2">
                  <button
                    onClick={() => {
                      sounds.playClick();
                      setIsFreeform(false);
                    }}
                    className="text-[10px] uppercase font-bold text-slate-500 hover:text-slate-400 transition-colors cursor-pointer"
                  >
                    Switch to Structured Pyramid Scaffolding
                  </button>
                </div>
              </div>
            )}

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
                      if (onGoToAssumptions) onGoToAssumptions();
                    }}
                    className="bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 px-4 py-2 rounded text-xs font-bold uppercase tracking-widest transition-colors flex items-center gap-2 cursor-pointer"
                  >
                    Track Assumptions
                  </button>
                )}
                {onNext && (
                  <button 
                    onClick={() => {
                      sounds.playTransition();
                      if (onNext) onNext();
                    }}
                    className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded text-xs font-bold uppercase tracking-widest transition-colors flex items-center gap-2 cursor-pointer"
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
