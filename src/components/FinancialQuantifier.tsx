import React, { useState } from "react";
import { toast } from "sonner";
import { buildQuantitativeEstimate, generateQuantificationPrompt } from "../services/geminiService";
import { ShimmerButton, EditableField, Tooltip } from "./MicroInteractions";
import { sounds } from '../lib/sounds';
import { Calculator, Lightbulb } from "lucide-react";
import { useAppContext } from '../context/AppContext';

export const FinancialQuantifier: React.FC = () => {
  const { appState, setAppState } = useAppContext();
  const [isQuantifying, setIsQuantifying] = useState(false);
  const [isGeneratingQuantPrompt, setIsGeneratingQuantPrompt] = useState(false);

  const handleQuantify = async () => {
    sounds.playClick();
    if (!appState.quantificationPrompt.trim()) {
      toast.error("Please describe the recommendation to quantify.");
      return;
    }
    setIsQuantifying(true);
    try {
      const result = await buildQuantitativeEstimate(
        appState.quantificationPrompt,
      );
      setAppState((prev) => ({ ...prev, quantitativeEstimate: result }));
      toast.success("Quantitative estimates updated!");
    } catch (err: any) {
      toast.error("Failed to build numbers: " + (err?.message || ""));
    } finally {
      setIsQuantifying(false);
    }
  };

  const handleGenerateQuantPrompt = async () => {
    sounds.playClick();
    if (!appState.coreRecommendation) return;
    setIsGeneratingQuantPrompt(true);
    try {
      const result = await generateQuantificationPrompt(
        appState.caseBrief,
        appState.expandedRecommendation?.resolution || appState.coreRecommendation
      );
      setAppState((prev) => ({ ...prev, quantificationPrompt: result }));
      toast.success("Quantification scenario generated!");
    } catch (err: any) {
      toast.error("Failed to generate quantification prompt: " + (err?.message || ""));
    } finally {
      setIsGeneratingQuantPrompt(false);
    }
  };

  return (
    <div className="space-y-3 pt-6 border-t border-slate-800 animate-in fade-in">
      <div className="flex justify-between items-end">
        <p className="text-[10px] uppercase text-slate-500 font-bold">
          Quantification Assistant
        </p>
        <Tooltip content="Auto-generate a description using AI based on your recommendation" position="left">
          <ShimmerButton
            onClick={handleGenerateQuantPrompt}
            disabled={isGeneratingQuantPrompt || !appState.coreRecommendation}
            isLoading={isGeneratingQuantPrompt}
            className="bg-amber-500/10 hover:bg-amber-500/20 disabled:bg-slate-800 text-amber-500 border border-amber-500/30 text-[10px] uppercase font-bold px-3 py-1.5 rounded transition-colors flex items-center gap-1.5"
          >
            <Lightbulb className="w-3 h-3" />
            {isGeneratingQuantPrompt ? "Analyzing..." : "AI Assistant"}
          </ShimmerButton>
        </Tooltip>
      </div>
      <div className="relative">
        <textarea
          className="w-full h-20 bg-slate-900 border border-slate-700 rounded-md p-3 text-sm text-slate-300 focus:outline-none focus:border-blue-500 resize-none font-sans"
          placeholder="Describe your recommendation in plain terms..."
          value={appState.quantificationPrompt}
          onChange={(e) =>
            setAppState((prev) => ({
              ...prev,
              quantificationPrompt: e.target.value,
            }))
          }
        />
        <ShimmerButton
          onClick={handleQuantify}
          disabled={isQuantifying}
          isLoading={isQuantifying}
          className="absolute bottom-3 right-3 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 text-[10px] uppercase font-bold text-white px-3 py-1.5 rounded transition-colors flex items-center gap-1.5"
        >
          <Calculator className="w-3 h-3" />
          {isQuantifying ? "Building..." : "Build the Numbers"}
        </ShimmerButton>
      </div>

      {appState.quantitativeEstimate && (
        <div className="p-4 border border-blue-900/50 bg-slate-900/50 rounded-lg space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { label: "TAM/SAM", data: appState.quantitativeEstimate.tam, field: 'tam' as const },
              { label: "Revenue Impact", data: appState.quantitativeEstimate.revenueImpact, field: 'revenueImpact' as const },
              { label: "Implementation Cost", data: appState.quantitativeEstimate.implementationCost, field: 'implementationCost' as const },
              { label: "Payback Period", data: appState.quantitativeEstimate.paybackPeriod, field: 'paybackPeriod' as const },
              { label: "Key Metric", data: appState.quantitativeEstimate.keyMetric, field: 'keyMetric' as const },
            ].map((item, idx) => (
              <div key={idx} className="bg-slate-800/50 rounded p-3 border border-slate-800/80">
                <p className="text-[10px] uppercase text-slate-500 font-bold mb-1">{item.label}</p>
                <div className="-m-1 p-1">
                  <EditableField
                    value={item.data.value}
                    onChange={(val) => {
                      if (!appState.quantitativeEstimate) return;
                      setAppState(prev => ({
                        ...prev,
                        quantitativeEstimate: {
                          ...prev.quantitativeEstimate!,
                          [item.field]: { ...prev.quantitativeEstimate![item.field], value: val }
                        }
                      }));
                    }}
                    textClassName="text-sm font-bold text-slate-200"
                  />
                </div>
                <div className="-m-1 p-1 mt-1">
                  <EditableField
                    value={item.data.assumption}
                    onChange={(val) => {
                      if (!appState.quantitativeEstimate) return;
                      setAppState(prev => ({
                        ...prev,
                        quantitativeEstimate: {
                          ...prev.quantitativeEstimate!,
                          [item.field]: { ...prev.quantitativeEstimate![item.field], assumption: val }
                        }
                      }));
                    }}
                    multiline
                    textClassName="text-[10px] text-slate-400 italic"
                  />
                </div>
              </div>
            ))}
          </div>
          <p className="text-[9px] text-slate-500 uppercase tracking-widest text-center mt-2">
            These are directional estimates for competition use — not financial advice.
          </p>
        </div>
      )}
    </div>
  );
};
