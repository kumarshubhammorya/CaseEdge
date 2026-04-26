import React, { useState } from 'react';
import { analyzeCase } from '../services/geminiService';
import { AppState, CaseGlance } from '../types';
import { ShimmerButton, CyclingLoadingText, EditableField, TypewriterText } from './MicroInteractions';

type Props = {
  appState: AppState;
  setAppState: React.Dispatch<React.SetStateAction<AppState>>;
};

export const IntakeSection: React.FC<Props> = ({ appState, setAppState }) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = async () => {
    if (!appState.caseBrief.trim()) {
      setError("Please paste a case brief first.");
      return;
    }
    setError(null);
    setIsAnalyzing(true);
    try {
      const result = await analyzeCase(appState.caseBrief);
      setAppState(prev => ({ ...prev, caseGlance: result }));
    } catch (err: any) {
      setError("Failed to analyze case. Please try again. " + (err?.message || ""));
      console.error(err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const updateGlance = (field: keyof CaseGlance, value: any) => {
    if (!appState.caseGlance) return;
    setAppState(prev => ({
      ...prev,
      caseGlance: { ...prev.caseGlance!, [field]: value }
    }));
  };

  return (
    <section className="bg-[#0f172a] flex flex-col flex-1 min-h-0 border border-slate-800 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="p-4 border-b border-slate-800 flex justify-between items-center">
        <h2 className="text-xs font-bold uppercase tracking-widest text-slate-500">Case Brief & Extraction</h2>
        <div className="flex items-center gap-2">
          {isAnalyzing ? (
            <>
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
              <span className="text-[10px] text-blue-400 font-medium uppercase min-w-[120px]">
                <CyclingLoadingText messages={['Scanning case structure...', 'Identifying stakeholders...', 'Classifying problem type...']} />
              </span>
            </>
          ) : (
            <>
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-[10px] text-slate-400 font-medium uppercase">
                Ready
              </span>
            </>
          )}
        </div>
      </div>
      
      <div className="p-6 space-y-6 flex-1 overflow-y-auto">
        <div className="relative">
          <textarea
            className="w-full h-40 bg-slate-900 border border-slate-700 rounded-md p-3 text-sm text-slate-300 focus:outline-none focus:border-blue-500 resize-none font-sans"
            placeholder="Paste case prompt, company background, exhibit notes..."
            value={appState.caseBrief}
            onChange={(e) => setAppState(prev => ({ ...prev, caseBrief: e.target.value }))}
          />
          <ShimmerButton
            onClick={handleAnalyze}
            disabled={isAnalyzing}
            isLoading={isAnalyzing}
            className="absolute bottom-3 right-3 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 text-[10px] uppercase font-bold text-white px-3 py-1.5 rounded transition-colors"
          >
            {isAnalyzing ? 'Analyzing...' : 'Analyze Case'}
          </ShimmerButton>
        </div>
        {error && <div className="text-red-400 text-xs">{error}</div>}

        {appState.caseGlance ? (
          <div className="space-y-4 animate-in fade-in">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
              Case at a Glance
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 border border-slate-800 rounded bg-slate-900/30">
                <p className="text-[10px] uppercase text-slate-500 font-bold mb-1">Industry</p>
                <EditableField
                  value={appState.caseGlance.industry}
                  onChange={(val) => updateGlance('industry', val)}
                  textClassName="text-sm font-medium text-slate-200 w-full"
                />
              </div>
              <div className="p-3 border border-slate-800 rounded bg-slate-900/30">
                <p className="text-[10px] uppercase text-slate-500 font-bold mb-1">Case Type</p>
                <EditableField
                  value={appState.caseGlance.caseType}
                  onChange={(val) => updateGlance('caseType', val)}
                  textClassName="text-sm font-medium text-slate-200 w-full"
                />
              </div>
              <div className="p-3 border border-slate-800 rounded bg-slate-900/30 col-span-2">
                <p className="text-[10px] uppercase text-slate-500 font-bold mb-1">Core Problem</p>
                <EditableField
                  value={appState.caseGlance.coreProblem}
                  onChange={(val) => updateGlance('coreProblem', val)}
                  multiline
                  textClassName="text-sm text-slate-200 w-full pt-1"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <p className="text-[10px] uppercase text-slate-500 font-bold">Key Stakeholders</p>
                <EditableField
                  value={appState.caseGlance.keyStakeholders.join('\n')}
                  onChange={(val) => updateGlance('keyStakeholders', val.split('\n'))}
                  multiline
                  className="bg-slate-900/30 border border-slate-800 rounded"
                  textClassName="text-xs text-slate-400 font-mono"
                />
              </div>
              <div className="space-y-2">
                <p className="text-[10px] uppercase text-slate-500 font-bold">Key Constraints</p>
                <EditableField
                  value={appState.caseGlance.keyConstraints.join('\n')}
                  onChange={(val) => updateGlance('keyConstraints', val.split('\n'))}
                  multiline
                  className="bg-slate-900/30 border border-slate-800 rounded"
                  textClassName="text-xs text-slate-400 font-mono"
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-slate-600 flex items-center gap-2">
              <span className="w-2 h-2 bg-slate-700 rounded-full"></span>
              Case at a Glance
            </h3>
            <div className="h-48 border border-dashed border-slate-800 rounded bg-slate-900/20 flex flex-col items-center justify-center text-slate-600">
               <span className="text-xs uppercase font-bold tracking-widest">Awaiting Case Extract</span>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
