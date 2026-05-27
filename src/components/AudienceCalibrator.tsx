import React, { useState } from "react";
import { toast } from "sonner";
import { calibrateLanguage } from "../services/geminiService";
import { ShimmerButton, EditableField, CopyActionButton } from "./MicroInteractions";
import { sounds } from '../lib/sounds';
import { SlidersHorizontal } from "lucide-react";
import { useAppContext } from '../context/AppContext';

export const AudienceCalibrator: React.FC = () => {
  const { appState, setAppState } = useAppContext();
  const [isCalibrating, setIsCalibrating] = useState(false);

  const handleCalibrateLanguage = async () => {
    sounds.playClick();
    if (!appState.coreRecommendation) return;
    setIsCalibrating(true);
    try {
      const textToCalibrate = appState.expandedRecommendation 
        ? `Situation: ${appState.expandedRecommendation.situation}\nComplication: ${appState.expandedRecommendation.complication}\nResolution: ${appState.expandedRecommendation.resolution}`
        : appState.coreRecommendation;
      const result = await calibrateLanguage(textToCalibrate, appState.jargonAudience);
      setAppState(prev => ({ ...prev, calibratedRecommendation: result }));
      toast.success(`Calibrated for ${appState.jargonAudience}`);
    } catch (err: any) {
      toast.error("Failed to calibrate: " + (err?.message || ""));
    } finally {
      setIsCalibrating(false);
    }
  };

  if (!appState.expandedRecommendation) return null;

  return (
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
              <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mb-2">Original</p>
              <p className="text-xs text-slate-400 whitespace-pre-wrap">
                {appState.expandedRecommendation 
                  ? `Situation: ${appState.expandedRecommendation.situation}\nComplication: ${appState.expandedRecommendation.complication}\nResolution: ${appState.expandedRecommendation.resolution}`
                  : appState.coreRecommendation}
              </p>
            </div>
            <div className="p-3 border border-blue-500/30 bg-blue-500/5 rounded relative group">
              <p className="text-[10px] text-blue-400 uppercase tracking-widest font-bold mb-2">Calibrated for {appState.jargonAudience}</p>
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
                className="absolute top-2 right-2 p-1.5 bg-blue-500/20 hover:bg-blue-500/40 text-blue-300 rounded opacity-0 group-hover:opacity-100"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
