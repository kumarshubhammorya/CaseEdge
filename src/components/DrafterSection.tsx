import React, { useState } from "react";
import {
  draftRecommendation,
  strengthenRecommendation,
  buildQuantitativeEstimate,
  generateStoryHook,
  calibrateLanguage
} from "../services/geminiService";
import { AppState, SCRStructure } from "../types";
import { Calculator, Mic, RefreshCw, SlidersHorizontal } from "lucide-react";
import { ShimmerButton, CyclingLoadingText, EditableField, CopyActionButton, TypewriterText } from './MicroInteractions';

type Props = {
  appState: AppState;
  setAppState: React.Dispatch<React.SetStateAction<AppState>>;
};

export const DrafterSection: React.FC<Props> = ({ appState, setAppState }) => {
  const [isDrafting, setIsDrafting] = useState(false);
  const [isStrengthening, setIsStrengthening] = useState(false);
  const [isQuantifying, setIsQuantifying] = useState(false);
  const [isHooking, setIsHooking] = useState(false);
  const [isCalibrating, setIsCalibrating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDraft = async () => {
    if (!appState.coreRecommendation.trim()) {
      setError("Please provide a core recommendation first.");
      return;
    }
    setError(null);
    setIsDrafting(true);
    try {
      const result = await draftRecommendation(appState.coreRecommendation);
      setAppState((prev) => ({ ...prev, expandedRecommendation: result }));
    } catch (err: any) {
      setError("Failed to draft structure. " + (err?.message || ""));
    } finally {
      setIsDrafting(false);
    }
  };

  const handleStrengthen = async () => {
    if (!appState.expandedRecommendation) return;
    setError(null);
    setIsStrengthening(true);
    try {
      const result = await strengthenRecommendation(
        appState.expandedRecommendation,
      );
      setAppState((prev) => ({ ...prev, expandedRecommendation: result }));
    } catch (err: any) {
      setError("Failed to strengthen recommendation. " + (err?.message || ""));
    } finally {
      setIsStrengthening(false);
    }
  };

  const updateSCR = (field: keyof SCRStructure, value: string) => {
    if (!appState.expandedRecommendation) return;
    setAppState((prev) => ({
      ...prev,
      expandedRecommendation: {
        ...prev.expandedRecommendation!,
        [field]: value,
      },
    }));
  };

  const handleQuantify = async () => {
    if (!appState.quantificationPrompt.trim()) {
      setError("Please describe the recommendation to quantify.");
      return;
    }
    setError(null);
    setIsQuantifying(true);
    try {
      const result = await buildQuantitativeEstimate(
        appState.quantificationPrompt,
      );
      setAppState((prev) => ({ ...prev, quantitativeEstimate: result }));
    } catch (err: any) {
      setError("Failed to build numbers. " + (err?.message || ""));
    } finally {
      setIsQuantifying(false);
    }
  };

  const handleStoryHook = async () => {
    if (!appState.coreRecommendation) return;
    setError(null);
    setIsHooking(true);
    try {
      const result = await generateStoryHook(appState.coreRecommendation, appState.expandedRecommendation);
      setAppState(prev => ({ ...prev, storyHook: result }));
    } catch (err: any) {
      setError("Failed to generate hook. " + (err?.message || ""));
    } finally {
      setIsHooking(false);
    }
  };

  const handleCalibrateLanguage = async () => {
    if (!appState.coreRecommendation) return;
    setError(null);
    setIsCalibrating(true);
    try {
      const textToCalibrate = appState.expandedRecommendation 
        ? `Situation: ${appState.expandedRecommendation.situation}\nComplication: ${appState.expandedRecommendation.complication}\nResolution: ${appState.expandedRecommendation.resolution}`
        : appState.coreRecommendation;
      const result = await calibrateLanguage(textToCalibrate, appState.jargonAudience);
      setAppState(prev => ({ ...prev, calibratedRecommendation: result }));
    } catch (err: any) {
      setError("Failed to calibrate. " + (err?.message || ""));
    } finally {
      setIsCalibrating(false);
    }
  };

  const isLoading = isDrafting || isStrengthening || isQuantifying || isHooking || isCalibrating;

  const getLoadingMessages = () => {
    if (isDrafting) return ["Drafting situation...", "Identifying core complication...", "Structuring resolution...", "Polishing SCR flow..."];
    if (isHooking) return ["Finding narrative hook...", "Building tension...", "Drafting 60-second intro..."];
    if (isQuantifying) return ["Estimating TAM/SAM...", "Calculating ROI...", "Structuring cost logic..."];
    if (isCalibrating) return ["Analyzing audience...", "Adjusting jargon...", "Refining tone..."];
    if (isStrengthening) return ["Analyzing logic...", "Tightening verbs...", "Sharpening impact..."];
    return [];
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
          {isLoading ? (
            <>
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
              <span className="text-[10px] text-blue-400 font-medium uppercase min-w-[120px]">
                <CyclingLoadingText messages={getLoadingMessages()} />
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
        {error && <div className="text-red-400 text-xs">{error}</div>}

        {appState.expandedRecommendation && (
          <div className="space-y-3 pt-2 animate-in fade-in">
            <div className="flex justify-between items-end">
              <p className="text-[10px] uppercase text-slate-500 font-bold">
                Recommendation (SCR Format)
              </p>
              <ShimmerButton
                onClick={handleStrengthen}
                disabled={isStrengthening}
                isLoading={isStrengthening}
                className="text-[10px] bg-blue-600/20 hover:bg-blue-600/30 disabled:opacity-50 text-blue-400 border border-blue-900/50 px-3 py-1.5 rounded font-bold transition-colors uppercase tracking-widest"
              >
                {isStrengthening ? "Strengthening..." : "Strengthen This"}
              </ShimmerButton>
            </div>
            <div className="p-4 border border-slate-800 bg-slate-900/80 rounded-lg space-y-4">
              <div className="flex items-start">
                <span className="text-[10px] font-mono text-blue-500 mt-1 mr-3 w-4">
                  S:
                </span>
                <div className="flex-1">
                  <EditableField
                    value={appState.expandedRecommendation.situation}
                    onChange={(val) => updateSCR("situation", val)}
                    multiline
                    className="p-1 -m-1"
                    textClassName="text-sm italic text-slate-400"
                  />
                </div>
              </div>
              <div className="flex items-start">
                <span className="text-[10px] font-mono text-blue-500 mt-1 mr-3 w-4">
                  C:
                </span>
                <div className="flex-1">
                  <EditableField
                    value={appState.expandedRecommendation.complication}
                    onChange={(val) => updateSCR("complication", val)}
                    multiline
                    className="p-1 -m-1"
                    textClassName="text-sm italic text-slate-400"
                  />
                </div>
              </div>
              <div className="flex items-start">
                <span className="text-[10px] font-mono text-blue-500 mt-1 mr-3 w-4">
                  R:
                </span>
                <div className="flex-1">
                  <EditableField
                    value={appState.expandedRecommendation.resolution}
                    onChange={(val) => updateSCR("resolution", val)}
                    multiline
                    className="p-1 -m-1"
                    textClassName="text-sm font-semibold text-white"
                  />
                </div>
              </div>
            </div>

            <div className="pt-2 flex flex-col gap-3">
              {!appState.storyHook ? (
                <ShimmerButton
                  onClick={handleStoryHook}
                  disabled={isHooking}
                  isLoading={isHooking}
                  className="self-start text-[10px] bg-amber-500/10 hover:bg-amber-500/20 disabled:opacity-50 text-amber-500 border border-amber-500/30 px-3 py-1.5 rounded font-bold transition-colors flex items-center gap-1.5 uppercase tracking-widest"
                >
                  <Mic className="w-3 h-3" />
                  {isHooking ? "Coaching..." : "Storytelling Coach"}
                </ShimmerButton>
              ) : (
                <div className="p-4 border border-amber-500/40 bg-amber-500/5 rounded-lg space-y-3 relative group">
                  <div className="flex items-center gap-2 mb-2">
                    <Mic className="w-4 h-4 text-amber-500" />
                    <p className="text-[10px] text-amber-500 font-bold uppercase tracking-widest">
                      The 60-Second Hook
                    </p>
                  </div>
                  <EditableField
                    value={appState.storyHook}
                    onChange={(val) => setAppState(prev => ({ ...prev, storyHook: val }))}
                    multiline
                    textClassName="text-slate-200 text-sm leading-relaxed italic font-serif"
                  />
                  <ShimmerButton
                    onClick={handleStoryHook}
                    disabled={isHooking}
                    isLoading={isHooking}
                    className="absolute top-3 right-3 text-[10px] bg-amber-500/20 hover:bg-amber-500/30 text-amber-500 px-2 py-1 rounded font-bold transition-colors flex items-center gap-1 uppercase opacity-0 group-hover:opacity-100"
                  >
                    <RefreshCw className={`w-3 h-3 ${isHooking ? 'animate-spin' : ''}`} />
                    {isHooking ? "Regenerating..." : "Regenerate angle"}
                  </ShimmerButton>
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-slate-800 space-y-3 mt-4">
              <div className="flex justify-between items-end">
                <p className="text-[10px] uppercase text-slate-500 font-bold flex items-center gap-2">
                  <SlidersHorizontal className="w-3 h-3" /> Jargon Calibrator
                </p>
              </div>
              <div className="flex flex-col gap-4">
                <div className="flex gap-2 items-center">
                  <select
                    className="bg-slate-900 border border-slate-700 text-slate-300 text-xs rounded px-2 py-1.5 outline-none focus:border-blue-500 flex-1 max-w-[200px]"
                    value={appState.jargonAudience}
                    onChange={(e) => setAppState(prev => ({ ...prev, jargonAudience: e.target.value }))}
                  >
                    <option>Consulting Judges</option>
                    <option>Finance Judges</option>
                    <option>Healthcare Executives</option>
                    <option>Academic Panel</option>
                    <option>Mixed</option>
                  </select>
                  <ShimmerButton
                    onClick={handleCalibrateLanguage}
                    disabled={isCalibrating || !appState.coreRecommendation}
                    isLoading={isCalibrating}
                    className="bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/50 text-blue-400 disabled:opacity-50 text-[10px] uppercase font-bold px-3 py-1.5 rounded transition-colors"
                  >
                    {isCalibrating ? 'Calibrating...' : 'Calibrate Language'}
                  </ShimmerButton>
                </div>
                
                {appState.calibratedRecommendation && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-3 border border-slate-800 bg-slate-900/30 rounded">
                      <p className="text-[9px] text-slate-500 uppercase tracking-widest font-bold mb-2">Original</p>
                      <p className="text-xs text-slate-400 whitespace-pre-wrap">
                        {appState.expandedRecommendation 
                          ? `Situation: ${appState.expandedRecommendation.situation}\nComplication: ${appState.expandedRecommendation.complication}\nResolution: ${appState.expandedRecommendation.resolution}`
                          : appState.coreRecommendation}
                      </p>
                    </div>
                    <div className="p-3 border border-indigo-500/30 bg-indigo-500/5 rounded relative group">
                      <p className="text-[9px] text-indigo-400 uppercase tracking-widest font-bold mb-2">Calibrated for {appState.jargonAudience}</p>
                      <div className="pr-8">
                        <EditableField
                           value={appState.calibratedRecommendation}
                           onChange={(val) => setAppState(prev => ({ ...prev, calibratedRecommendation: val }))}
                           multiline
                           textClassName="text-xs text-slate-200"
                        />
                      </div>
                      <CopyActionButton 
                        textToCopy={appState.calibratedRecommendation}
                        className="absolute top-2 right-2 p-1.5 bg-indigo-500/20 hover:bg-indigo-500/40 text-indigo-300 rounded opacity-0 group-hover:opacity-100"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="space-y-3 pt-6 border-t border-slate-800 animate-in fade-in">
          <div className="flex justify-between items-end">
            <p className="text-[10px] uppercase text-slate-500 font-bold">
              Quantification Assistant
            </p>
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
                  { label: "TAM/SAM", data: appState.quantitativeEstimate.tam, field: 'tam' },
                  { label: "Revenue Impact", data: appState.quantitativeEstimate.revenueImpact, field: 'revenueImpact' },
                  { label: "Implementation Cost", data: appState.quantitativeEstimate.implementationCost, field: 'implementationCost' },
                  { label: "Payback Period", data: appState.quantitativeEstimate.paybackPeriod, field: 'paybackPeriod' },
                  { label: "Key Metric", data: appState.quantitativeEstimate.keyMetric, field: 'keyMetric' },
                ].map((item, idx) => (
                  <div key={idx} className="bg-slate-800/50 rounded p-3 border border-slate-800/80">
                    <p className="text-[10px] uppercase text-slate-500 font-bold mb-1">{item.label}</p>
                    <TypewriterText text={item.data.value} className="text-sm font-bold text-slate-200 block mb-1" />
                    <TypewriterText text={'"' + item.data.assumption + '"'} className="text-[10px] text-slate-400 italic block" delay={5} />
                  </div>
                ))}
              </div>
              <p className="text-[9px] text-slate-500 uppercase tracking-widest text-center mt-2">
                These are directional estimates for competition use — not financial advice.
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
